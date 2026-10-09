import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import type { AstroIntegration } from '../dist/types/public/integrations.js';
import testAdapter from './test-adapter.ts';
import { testImageService } from './test-image-service.ts';
import { type App, type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('astro:assets - separate build and runtime image services', () => {
	let fixture: Fixture;
	let app: App;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/core-image-ssr/',
			output: 'server',
			outDir: './dist/image-service-targets/',
			adapter: testAdapter(),
			image: {
				service: {
					build: testImageService({ foo: 'build' }),
					runtime: testImageService({ foo: 'runtime' }),
				},
				domains: ['avatars.githubusercontent.com'],
			},
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	it('uses the build service for prerendered pages and generates their images', async () => {
		const $ = cheerio.load(await fixture.readFile('/client/prerender/index.html'));
		const $img = $('#local img');
		assert.equal($img.attr('data-service-config'), 'build');
		const src = $img.attr('src')!;
		assert.match(src, /^\/_astro\/penguin2\..+\.webp$/);
		assert.ok(fixture.pathExists(`/client${src}`));
	});

	it('uses the runtime service for on-demand pages', async () => {
		const response = await app.render(new Request('http://example.com/'));
		const $ = cheerio.load(await response.text());
		const $img = $('#local img');
		assert.equal($img.attr('data-service-config'), 'runtime');
		assert.ok($img.attr('src')!.startsWith('/_image?'));
	});
});

const wrappingPrerenderer: AstroIntegration = {
	name: 'wrapping-prerenderer',
	hooks: {
		'astro:build:start': ({ setPrerenderer }) => {
			setPrerenderer((defaultPrerenderer) => ({ ...defaultPrerenderer, name: 'wrapping' }));
		},
	},
};

for (const [name, integrations] of [
	['default prerenderer', []],
	['wrapping prerenderer', [wrappingPrerenderer]],
] as const) {
	describe(`astro:assets - build image service resolved by Vite (${name})`, () => {
		let fixture: Fixture;

		before(async () => {
			const id = name.replace(' ', '-');
			// A fresh asset cache, so the image is generated with the service on every run.
			const cacheDir = `./node_modules/.astro-image-service-vite-${id}/`;
			await fs.rm(new URL(`./fixtures/core-image-ssr/${cacheDir}`, import.meta.url), {
				recursive: true,
				force: true,
			});
			fixture = await loadFixture({
				root: './fixtures/core-image-ssr/',
				output: 'server',
				outDir: `./dist/image-service-vite-${id}/`,
				cacheDir,
				adapter: testAdapter(),
				integrations: [...integrations],
				image: {
					service: { entrypoint: '~/aliased-image-service' },
					domains: ['avatars.githubusercontent.com'],
				},
				vite: {
					resolve: {
						alias: { '~': new URL('./fixtures/core-image-ssr/src', import.meta.url).pathname },
					},
				},
			});
			await fixture.build();
		});

		it('generates images with an aliased TypeScript service that reads import.meta.env', async () => {
			const $ = cheerio.load(await fixture.readFile('/client/prerender/index.html'));
			const $img = $('#local img');
			assert.equal($img.attr('data-service-base'), '/');
			const src = $img.attr('src')!;
			assert.match(src, /^\/_astro\/penguin2\..+\.webp$/);
			const data = (await fixture.readFile(`/client${src}`, null)) as unknown as Buffer;
			assert.equal(Buffer.from(data.subarray(0, 17)).toString('utf8'), 'ALIASED_TRANSFORM');
		});
	});
}

describe('astro:assets - separate build and runtime image services in dev', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/core-image-ssr/',
			output: 'server',
			adapter: testAdapter(),
			image: {
				service: {
					build: testImageService({ foo: 'build' }),
					runtime: testImageService({ foo: 'runtime' }),
				},
				domains: ['avatars.githubusercontent.com'],
			},
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	for (const [name, path] of [
		['prerendered', '/prerender'],
		['on-demand', '/'],
	]) {
		it(`uses the build service for ${name} pages and the image endpoint`, async () => {
			const $ = cheerio.load(await (await fixture.fetch(path)).text());
			const $img = $('#local img');
			assert.equal($img.attr('data-service-config'), 'build');
			const src = $img.attr('src')!;
			assert.ok(src.startsWith('/_image?'));
			const image = await fixture.fetch(src);
			assert.equal(image.status, 200);
		});
	}
});
