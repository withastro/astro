import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

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
