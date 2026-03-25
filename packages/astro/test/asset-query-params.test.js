import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import woof from './fixtures/multiple-jsx-renderers/renderers/woof/index.mjs';
import meow from './fixtures/multiple-jsx-renderers/renderers/meow/index.mjs';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

const multiCdnAssetsPrefix = {
	js: 'https://js.example.com',
	css: 'https://css.example.com',
	fallback: 'https://example.com',
};

describe('Asset Query Parameters (Adapter Client Config)', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-assets/',
			output: 'server',
			adapter: testAdapter({
				extendAdapter: {
					client: {
						assetQueryParams: new URLSearchParams({ dpl: 'test-deploy-id' }),
					},
				},
			}),
		});
		await fixture.build();
	});

	it('appends assetQueryParams to stylesheet URLs in SSR', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		assert.equal(response.status, 200);
		const html = await response.text();
		const $ = cheerio.load(html);
		const stylesheets = $('link[rel="stylesheet"]');
		assert.ok(stylesheets.length > 0, 'Should have at least one stylesheet');
		stylesheets.each((_i, el) => {
			const href = $(el).attr('href');
			assert.match(
				href,
				/\?dpl=test-deploy-id/,
				`Stylesheet href should include assetQueryParams: ${href}`,
			);
		});
	});

	it('appends assetQueryParams to Image component src', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		assert.equal(response.status, 200);
		const html = await response.text();
		const $ = cheerio.load(html);
		const image = $('img#test-image');
		assert.ok(image.length > 0, 'Should have image with id="test-image"');
		const src = image.attr('src');
		assert.match(src, /dpl=test-deploy-id/, `Image src should include assetQueryParams: ${src}`);
	});
});

describe('Asset Query Parameters with Fonts', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/fonts/',
			output: 'server',
			adapter: testAdapter({
				extendAdapter: {
					client: {
						assetQueryParams: new URLSearchParams({ dpl: 'test-deploy-id' }),
					},
				},
			}),
		});
		await fixture.build();
	});

	it('appends assetQueryParams to font requests', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/preload');
		const response = await app.render(request);
		assert.equal(response.status, 200);
		const html = await response.text();
		const $ = cheerio.load(html);
		const fontLinks = $('link[rel="preload"][as="font"]');
		assert.ok(fontLinks.length > 0, 'Should have at least one font preload link');
		fontLinks.each((_i, el) => {
			const href = $(el).attr('href');
			assert.match(
				href,
				/dpl=test-deploy-id/,
				`Font href should include assetQueryParams: ${href}`,
			);
		});
	});
});

describe('Asset Query Parameters with Islands', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/multiple-jsx-renderers/',
			output: 'server',
			integrations: [woof({ include: '**/*.woof.jsx' }), meow({ include: '**/*.meow.jsx' })],
			adapter: testAdapter({
				extendAdapter: {
					client: {
						assetQueryParams: new URLSearchParams({ dpl: 'test-deploy-id' }),
					},
				},
			}),
		});
		await fixture.build();
	});

	it('appends assetQueryParams to astro-island component and renderer URLs', async () => {
		const app = await fixture.loadTestAdapterApp();
		const response = await app.render(new Request('http://example.com/client-load'));
		assert.equal(response.status, 200);
		const html = await response.text();
		const $ = cheerio.load(html);
		const island = $('astro-island').first();

		assert.ok(island.length > 0, 'Should have at least one astro-island');
		assert.match(
			island.attr('component-url'),
			/\?dpl=test-deploy-id/,
			`astro-island component-url should include assetQueryParams: ${island.attr('component-url')}`,
		);
		assert.match(
			island.attr('renderer-url'),
			/\?dpl=test-deploy-id/,
			`astro-island renderer-url should include assetQueryParams: ${island.attr('renderer-url')}`,
		);
	});
});

describe('Asset Query Parameters with Islands and assetsPrefix map', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-assets-prefix/',
			output: 'server',
			adapter: testAdapter({
				extendAdapter: {
					client: {
						assetQueryParams: new URLSearchParams({ dpl: 'test-deploy-id' }),
					},
				},
			}),
			build: {
				assetsPrefix: multiCdnAssetsPrefix,
			},
		});
		await fixture.build();
	});

	it('uses js assetsPrefix for island URLs while appending assetQueryParams', async () => {
		const app = await fixture.loadTestAdapterApp();
		const response = await app.render(new Request('http://example.com/custom-base/'));
		assert.equal(response.status, 200);
		const html = await response.text();
		const $ = cheerio.load(html);
		const island = $('astro-island').first();

		assert.ok(island.length > 0, 'Should have at least one astro-island');
		assert.match(
			island.attr('component-url'),
			/^https:\/\/js\.example\.com\/_astro\/.*\?dpl=test-deploy-id$/,
			`astro-island component-url should use js assetsPrefix and include assetQueryParams: ${island.attr('component-url')}`,
		);
		assert.match(
			island.attr('renderer-url'),
			/^https:\/\/js\.example\.com\/_astro\/.*\?dpl=test-deploy-id$/,
			`astro-island renderer-url should use js assetsPrefix and include assetQueryParams: ${island.attr('renderer-url')}`,
		);
	});
});
