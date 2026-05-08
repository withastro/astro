import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';

import { testImageService } from './test-image-service.ts';
import { type AstroInlineConfig, type Fixture, loadFixture } from './test-utils.ts';

const defaultSettings: AstroInlineConfig = {
	root: './fixtures/core-image-unconventional-settings/',
	image: {
		service: testImageService(),
	},
};

describe('astro:assets - Support unconventional build settings properly', () => {
	let fixture: Fixture;

	it('supports assetsPrefix', async () => {
		fixture = await loadFixture({
			...defaultSettings,
			build: {
				assetsPrefix: 'https://cdn.example.com/',
			},
			outDir: './dist/core-image-unconventional-assets-prefix/',
		});
		await fixture.build();

		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const src = $('#walrus-img').attr('src')!;
		assert.equal(src.startsWith('https://cdn.example.com/'), true);

		const data = await fixture.readBuffer(src.replace('https://cdn.example.com/', ''));
		assert.equal(data instanceof Buffer, true);
	});

	it('supports base', async () => {
		fixture = await loadFixture({
			...defaultSettings,
			base: '/subdir/',
			outDir: './dist/core-image-unconventional-base/',
		});
		await fixture.build();

		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const src = $('#walrus-img').attr('src')!;
		const data = await fixture.readBuffer(src.replace('/subdir/', ''));
		assert.equal(data instanceof Buffer, true);
	});

	// This test is a bit of a stretch, but it's a good sanity check, `assetsPrefix` should take precedence over `base` in this context
	it('supports assetsPrefix + base', async () => {
		fixture = await loadFixture({
			...defaultSettings,
			base: '/subdir/',
			build: {
				assetsPrefix: 'https://cdn.example.com/',
			},
			outDir: './dist/core-image-unconventional-assets-prefix-base/',
		});
		await fixture.build();

		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const src = $('#walrus-img').attr('src')!;
		assert.equal(src.startsWith('https://cdn.example.com/'), true);

		const data = await fixture.readBuffer(src.replace('https://cdn.example.com/', ''));
		assert.equal(data instanceof Buffer, true);
	});

	it('supports custom build.assets', async () => {
		fixture = await loadFixture({
			...defaultSettings,
			build: {
				assets: 'assets',
			},
			outDir: './dist/core-image-unconventional-custom-assets/',
		});
		await fixture.build();

		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		const unoptimizedSrc = $('#walrus-img-unoptimized').attr('src')!;
		assert.equal(unoptimizedSrc.startsWith('/assets/'), true);

		const src = $('#walrus-img').attr('src')!;
		const data = await fixture.readBuffer(src);

		assert.equal(data instanceof Buffer, true);
	});

	it('supports custom vite.build.rollupOptions.output.assetFileNames', async () => {
		fixture = await loadFixture({
			...defaultSettings,
			build: {
				assets: 'images',
			},
			vite: {
				environments: {
					prerender: {
						build: {
							rollupOptions: {
								output: {
									assetFileNames: 'images/hello_[name].[ext]',
								},
							},
						},
					},
				},
			},
			outDir: './dist/core-image-unconventional-rollup-asset-names/',
		});
		await fixture.build();

		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const unoptimizedSrc = $('#walrus-img-unoptimized').attr('src');
		assert.equal(unoptimizedSrc, '/images/hello_light_walrus.avif');

		const src = $('#walrus-img').attr('src')!;
		const data = await fixture.readBuffer(src);

		assert.equal(data instanceof Buffer, true);
	});

	it('supports complex vite.build.rollupOptions.output.assetFileNames', async () => {
		fixture = await loadFixture({
			...defaultSettings,
			build: {
				assets: 'assets',
			},
			vite: {
				environments: {
					prerender: {
						build: {
							rollupOptions: {
								output: {
									assetFileNames: 'assets/[hash]/[name][extname]',
								},
							},
						},
					},
				},
			},
			outDir: './dist/core-image-unconventional-complex-asset-names/',
		});
		await fixture.build();

		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const unoptimizedSrc = $('#walrus-img-unoptimized').attr('src')!;
		const originalData = await fixture.readBuffer(unoptimizedSrc);
		assert.equal(originalData instanceof Buffer, true);

		const src = $('#walrus-img').attr('src')!;
		const data = await fixture.readBuffer(src);

		assert.equal(data instanceof Buffer, true);
	});

	it('supports custom vite.build.rollupOptions.output.assetFileNames with assetsPrefix', async () => {
		fixture = await loadFixture({
			...defaultSettings,
			vite: {
				environments: {
					prerender: {
						build: {
							rollupOptions: {
								output: {
									assetFileNames: 'images/hello_[name].[ext]',
								},
							},
						},
					},
				},
			},
			build: {
				assets: 'images',
				assetsPrefix: 'https://cdn.example.com/',
			},
			outDir: './dist/core-image-unconventional-rollup-with-prefix/',
		});
		await fixture.build();

		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const unoptimizedSrc = $('#walrus-img-unoptimized').attr('src')!;
		assert.equal(unoptimizedSrc, 'https://cdn.example.com/images/hello_light_walrus.avif');

		const unoptimizedData = await fixture.readBuffer(
			unoptimizedSrc.replace('https://cdn.example.com/', ''),
		);
		assert.equal(unoptimizedData instanceof Buffer, true);

		const src = $('#walrus-img').attr('src')!;
		assert.equal(src.startsWith('https://cdn.example.com/'), true);

		const data = await fixture.readBuffer(src.replace('https://cdn.example.com/', ''));
		assert.equal(data instanceof Buffer, true);
	});
});
