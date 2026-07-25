import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type DevServer, type Fixture, loadFixture, type PreviewServer } from './test-utils.ts';

describe('CompileImageService', () => {
	let fixture: Fixture;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/compile-image-service/',
		});
	});

	describe('dev', () => {
		let devServer: DevServer;
		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		// In dev, the compile service falls back to passthrough because sharp cannot run in workerd. Images are served unoptimized
		// through the /_image endpoint.
		it('returns 200 for local images via /_image endpoint', async () => {
			const html = await fixture.fetch('/blog/post').then((res) => res.text());
			const $ = cheerio.load(html);
			const src = $('img').attr('src')!;
			assert.ok(
				src.startsWith('/_image'),
				`Expected image src to route through /_image, got: ${src}`,
			);
			const res = await fixture.fetch(src);
			assert.equal(res.status, 200);
		});
	});

	describe('preview', () => {
		let previewServer: PreviewServer;
		before(async () => {
			await fixture.build();
			previewServer = await fixture.preview();
		});

		after(async () => {
			await previewServer.stop();
		});

		it('forbids http://', async () => {
			const res = await fixture.fetch('/_image?href=http://placehold.co/600x400');
			const html = await res.text();
			const status = res.status;
			assert.equal(html, 'Forbidden');
			assert.equal(status, 403);
		});

		it('forbids https://', async () => {
			const res = await fixture.fetch('/_image?href=https://placehold.co/600x400');
			const html = await res.text();
			const status = res.status;
			assert.equal(html, 'Forbidden');
			assert.equal(status, 403);
		});

		it('forbids //', async () => {
			const res = await fixture.fetch('/_image?href=//placehold.co/600x400');
			const html = await res.text();
			const status = res.status;
			assert.equal(html, 'Blocked');
			assert.equal(status, 403);
		});

		it('allows local', async () => {
			const res = await fixture.fetch('/_image?href=/_astro/placeholder.gLBdjEDe.jpg&f=jpg');
			assert.equal(res.status, 200);
			const blob = await res.blob();
			assert.equal(blob.type, 'image/jpeg');
		});
	});
});

// Both `imageService: 'compile'` and `imageService: 'custom'` opt in to build-time
// asset generation.
//
// | imageService | user image.service   | build assets | worker bundle             |
// | ------------ | -------------------- | ------------ | ------------------------- |
// | 'compile'    | none (default Sharp) | real WEBP    | clean (no Sharp)          |
// | 'compile'    | custom, Sharp-free   | CUSTOM_*     | user service, no Sharp    |
// | 'compile'    | custom, Sharp-backed | real WEBP    | Sharp chain bundled       |
// | 'custom'     | none (default Sharp) | real WEBP    | Sharp dragged in (beware) |
// | 'custom'     | custom, Sharp-free   | CUSTOM_*     | user service, no Sharp    |
// | 'custom'     | custom, Sharp-backed | real WEBP    | Sharp chain bundled       |
//
// The `default` and Sharp-backed `sharp` cases generate assets with Astro's real
// Sharp native binary at build time, which cannot load on every CI runner (notably
// the Windows runner: `ERR_DLOPEN_FAILED`). Those two tests are skipped on Windows;
// the Sharp-free `user` service runs its stub transform() on the Node side and is
// exercised on all platforms.
const skipRealSharp =
	process.platform === 'win32' && 'Sharp native binary cannot load on Windows CI';
describe('CompileImageService build-time image generation', () => {
	async function readServerBundle(fixture: Fixture) {
		const serverFiles = await fixture.glob('server/**/*.mjs');
		const contents = await Promise.all(
			serverFiles.map(async (file) => await fixture.readFile(file)),
		);

		return contents.join('\n');
	}

	function assertSharpBundled(serverBundle: string) {
		assert.match(serverBundle, /import\("sharp"\)/, 'expected the worker bundle to import "sharp"');
		assert.match(
			serverBundle,
			/assets\/services\/sharp/,
			"expected Astro's Sharp service in the worker bundle",
		);
	}

	function assertSharpNotBundled(serverBundle: string) {
		assert.doesNotMatch(
			serverBundle,
			/import\("sharp"\)/,
			'expected the worker bundle to be free of "sharp"',
		);
		assert.doesNotMatch(
			serverBundle,
			/assets\/services\/sharp/,
			'expected no Astro Sharp service in the worker bundle',
		);
	}

	function assertRealWebp(data: Buffer) {
		assert.equal(data.subarray(0, 4).toString('utf8'), 'RIFF');
		assert.equal(data.subarray(8, 12).toString('utf8'), 'WEBP');
	}

	/**
	 * Builds the `compile-custom-image-service` fixture, rewriting its config for
	 * the requested build mode and image service before the build and restoring it
	 * afterwards.
	 *
	 * @param mode    `'compile'` or `'custom'`.
	 * @param service `'default'` removes the user `image.service` (Astro's default
	 *                Sharp service applies), `'sharp'` swaps in a Sharp-backed user
	 *                service, and `'user'` keeps the fixture's Sharp-free service.
	 */
	async function buildFixture(
		mode: 'compile' | 'custom',
		service: 'default' | 'user' | 'sharp',
		outDirName: string,
	) {
		const fixture = await loadFixture({
			root: './fixtures/compile-custom-image-service/',
			outDir: `./dist/compile-custom-image-service-${outDirName}/`,
		});
		const resetConfig = await fixture.editFile(
			'astro.config.mjs',
			(contents) => {
				let next = contents.replace("imageService: 'compile'", `imageService: '${mode}'`);
				if (service === 'sharp') {
					next = next.replace(
						"entrypoint: './src/image-service.ts'",
						"entrypoint: './src/sharp-image-service.ts'",
					);
				} else if (service === 'default') {
					next = next.replace(
						"\n\timage: {\n\t\tservice: {\n\t\t\tentrypoint: './src/image-service.ts',\n\t\t},\n\t},",
						'',
					);
				}
				return next;
			},
			false,
		);

		try {
			await fixture.build();
			return {
				fixture,
				html: await fixture.readFile('client/index.html'),
			};
		} finally {
			resetConfig();
		}
	}

	async function readGeneratedImage(fixture: Fixture, html: string) {
		const src = cheerio.load(html)('img').attr('src');
		assert.match(src ?? '', /^\/_astro\/.+\.webp$/, 'expected a hashed .webp asset in the markup');
		return (await fixture.readFile(`client${src}`, null)) as unknown as Buffer;
	}

	for (const mode of ['compile', 'custom'] as const) {
		describe(`imageService: '${mode}'`, () => {
			it('with no user image.service: generates real WEBP assets at build time', {
				skip: skipRealSharp,
			}, async () => {
				const { fixture, html } = await buildFixture(mode, 'default', `${mode}-default`);

				// Build-time generation runs Astro's default Sharp service on the Node side.
				assertRealWebp(await readGeneratedImage(fixture, html));

				const serverBundle = await readServerBundle(fixture);
				if (mode === 'compile') {
					// `compile` resolves to the workerd-safe service, so Sharp stays out of the
					// worker bundle (it only runs on the Node side at build time).
					assertSharpNotBundled(serverBundle);
				} else {
					// `custom` leaves Astro's default Sharp service as the runtime service, so it is
					// dragged into the worker bundle (where it cannot run). This is the documented
					// "beware" tradeoff of `custom` without a workerd-safe `image.service`.
					assertSharpBundled(serverBundle);
				}
			});

			it('with a Sharp-free user image.service: runs its transform() at build time and respects its markup, without bundling Sharp', async () => {
				const { fixture, html } = await buildFixture(mode, 'user', `${mode}-user`);
				const img = cheerio.load(html)('img');

				assert.equal(img.attr('data-image-service'), 'custom');

				// The user service's transform() ran during the build (prepends a marker).
				const data = await readGeneratedImage(fixture, html);
				assert.equal(Buffer.from(data.subarray(0, 20)).toString('utf8'), 'CUSTOM_TRANSFORM_RAN');

				// The user service is bundled, but it is Sharp-free so Sharp stays out.
				const serverBundle = await readServerBundle(fixture);
				assert.match(serverBundle, /src\/image-service\.ts/);
				assertSharpNotBundled(serverBundle);

				if (mode === 'compile') {
					// Runtime serves the prerendered assets through the passthrough endpoint.
					assert.match(serverBundle, /image-passthrough-endpoint/);
				} else {
					// `custom` keeps the user service live at runtime via the generic endpoint.
					assert.match(serverBundle, /astro\/dist\/assets\/endpoint\/generic\.js/);
					assert.doesNotMatch(serverBundle, /image-passthrough-endpoint/);
				}
			});

			it('with a Sharp-backed user image.service: generates assets, respects its markup, and bundles the Sharp chain', {
				skip: skipRealSharp,
			}, async () => {
				const { fixture, html } = await buildFixture(mode, 'sharp', `${mode}-sharp`);
				const img = cheerio.load(html)('img');

				assert.equal(img.attr('data-image-service'), 'custom-sharp');
				assertRealWebp(await readGeneratedImage(fixture, html));

				// The user opted into a Sharp-backed runtime service, so the Sharp chain
				// is expected in the worker bundle.
				const serverBundle = await readServerBundle(fixture);
				assert.match(serverBundle, /src\/sharp-image-service\.ts/);
				assertSharpBundled(serverBundle);
			});
		});
	}
});
