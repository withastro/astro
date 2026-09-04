import assert from 'node:assert/strict';
import fs from 'node:fs';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

// The Cloudflare prerenderer renders pages out of process in workerd. With
// `build.concurrency > 1` the build issues concurrent requests to one isolate,
// so per-path incremental metadata is attributed inside the worker through an
// AsyncLocalStorage-backed render scope (installed under the auto-appended
// `nodejs_als` compatibility flag — this fixture configures no compat flags of
// its own, so metadata arriving at all proves the flag reached workerd). Each
// framed response carries the metadata before the raw rendered bytes.
describe('experimental.incrementalBuild with build.concurrency > 1 (workerd)', () => {
	const root = new URL('./fixtures/incremental-concurrency/', import.meta.url);
	const cacheFile = new URL('node_modules/.astro/incremental-build.json', root);
	let fixture: Fixture;
	let manifest: any;

	function pathEntry(route: string, pathname: string) {
		return manifest.routes[route]?.paths?.[pathname];
	}

	before(async () => {
		fs.rmSync(new URL('dist/', root), { recursive: true, force: true });
		fs.rmSync(new URL('node_modules/.astro/', root), { recursive: true, force: true });
		fixture = await loadFixture({ root: './fixtures/incremental-concurrency/' });
		await fixture.build();
		manifest = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
	});

	it('attributes content entries to the correct paths, shared entries included', () => {
		const one = pathEntry('src/pages/docs/[slug].astro', '/docs/one');
		const two = pathEntry('src/pages/docs/[slug].astro', '/docs/two');
		assert.deepEqual(Object.keys(one.contentHashes).sort(), [
			'src/content/docs/one.mdx',
			'src/content/docs/shared.mdx',
		]);
		assert.deepEqual(Object.keys(two.contentHashes).sort(), [
			'src/content/docs/shared.mdx',
			'src/content/docs/two.mdx',
		]);
		// The shared entry hashes identically on both paths.
		assert.equal(
			one.contentHashes['src/content/docs/shared.mdx'],
			two.contentHashes['src/content/docs/shared.mdx'],
		);
	});

	it('attributes image transforms per path, dedup hits included', () => {
		const picA = pathEntry('src/pages/pic/[slug].astro', '/pic/a');
		const picB = pathEntry('src/pages/pic/[slug].astro', '/pic/b');
		assert.ok(picA.staticImages?.length > 0, '/pic/a should record its transforms');
		assert.ok(picB.staticImages?.length > 0, '/pic/b should record its transforms');

		// Both pages resolve the same width-100 transform. Whichever rendered
		// second hit the worker's dedup map, and the hit must still be attributed.
		const hashesA = new Set<string>(picA.staticImages.map((i: any) => i.hash));
		const hashesB = new Set<string>(picB.staticImages.map((i: any) => i.hash));
		for (const hash of hashesA) {
			assert.ok(hashesB.has(hash), `shared transform ${hash} should be attributed to /pic/b too`);
		}
		// /pic/b resolves an extra width-50 transform of its own.
		assert.ok(
			[...hashesB].some((hash) => !hashesA.has(hash)),
			'/pic/b should also record its non-shared transform',
		);
	});

	it('preserves arbitrary non-2xx response bytes', () => {
		assert.deepEqual(
			fs.readFileSync(new URL('dist/client/status/not-found.bin', root)),
			Buffer.from([0, 255, 128, 65]),
		);
	});

	it('preserves null response bodies', () => {
		assert.equal(fixture.pathExists('/client/empty/no-body.txt'), false);
	});

	describe('second build (no changes)', () => {
		let picAImages: string[];
		let picBImages: string[];

		before(async () => {
			picAImages = pathEntry('src/pages/pic/[slug].astro', '/pic/a').staticImages.map(
				(i: any) => i.finalPath,
			);
			picBImages = pathEntry('src/pages/pic/[slug].astro', '/pic/b').staticImages.map(
				(i: any) => i.finalPath,
			);

			// A skipped path is restored from its cached copy (dist/ is emptied each
			// build). Plant sentinels there: a restore keeps them, a re-render would
			// overwrite them.
			const docsOne = pathEntry('src/pages/docs/[slug].astro', '/docs/one');
			const picA = pathEntry('src/pages/pic/[slug].astro', '/pic/a');
			fs.writeFileSync(
				new URL(`node_modules/.astro/dist/${docsOne.outputFile}`, root),
				'cached docs one sentinel',
			);
			fs.writeFileSync(
				new URL(`node_modules/.astro/dist/${picA.outputFile}`, root),
				'cached pic a sentinel',
			);
			await fixture.build();
		});

		it('skips every path and restores it from the cache', async () => {
			assert.equal(
				await fixture.readFile('/client/docs/one/index.html'),
				'cached docs one sentinel',
			);
			assert.equal(await fixture.readFile('/client/pic/a/index.html'), 'cached pic a sentinel');
		});

		it('still emits shared and non-shared optimized images for skipped pages', () => {
			for (const finalPath of [...picAImages, ...picBImages]) {
				assert.ok(
					fixture.pathExists(`/client${finalPath}`),
					`optimized image ${finalPath} should be replayed for the skipped page`,
				);
			}
		});
	});
});
