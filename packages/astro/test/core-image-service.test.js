import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import { lookup as probe } from '../dist/assets/utils/vendor/image-size/lookup.js';

async function getImageDimensionsFromFixture(fixture, path) {
	/** @type { Response } */
	const res = await fixture.fetch(path instanceof URL ? path.pathname + path.search : path);
	const buffer = await res.arrayBuffer();
	const { width, height } = await probe(new Uint8Array(buffer));
	return { width, height };
}

describe('astro image service', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	describe('dev image service', () => {
		/** @type {import('./test-utils').DevServer} */
		let devServer;
		/** @type {Array<{ type: any, level: 'error', message: string; }>} */
		let logs = [];

		before(async () => { 
			fixture = await loadFixture({
				root: './fixtures/core-image-layout/',
				image: {
					domains: ['unsplash.com'],
				},
			});

			devServer = await fixture.startDevServer({});
		});

		after(async () => {
			await devServer.stop();
		});

		describe('generated images', () => {
			let $;
			let src 
			before(async () => {
				const res = await fixture.fetch('/fit');
				const html = await res.text();
				$ = cheerio.load(html);
				let $img = $('#local-both img');
				src = new URL($img.attr('src'), 'http://localhost').href
			});

			it('generates width and height in image URLs when both are provided', async () => {
				const url = new URL(src);
				const { width, height } = await getImageDimensionsFromFixture(fixture, url);
				assert.equal(width, 300);
				assert.equal(height, 400);
			});

			it('generates height in image URLs when only width is provided', async () => {
				const url = new URL(src);
				url.searchParams.delete('h');
				const { width, height } = await getImageDimensionsFromFixture(fixture, url);
				assert.equal(width, 300);
				assert.equal(height, 200);
			});

			it('generates width in image URLs when only height is provided', async () => {
				const url = new URL(src);
				url.searchParams.delete('w');
				url.searchParams.set('h', '400');
				const { width, height } = await getImageDimensionsFromFixture(fixture, url);
				assert.equal(width, 600);
				assert.equal(height, 400);
			});

			it('preserves aspect ratio when fit=inside', async () => {
				const url = new URL(src);
				url.searchParams.set('fit', 'inside');
				const { width, height } = await getImageDimensionsFromFixture(fixture, url);
				assert.equal(width, 300);
				assert.equal(height, 200);
			});

			it('preserves aspect ratio when fit=scale-down', async () => {
				const url = new URL(src);
				url.searchParams.set('fit', 'scale-down');
				const { width, height } = await getImageDimensionsFromFixture(fixture, url);
				assert.equal(width, 300);
				assert.equal(height, 200);
			});

			it('preserves aspect ratio when fit=outside', async () => {
				const url = new URL(src);
				url.searchParams.set('fit', 'outside');
				const { width, height } = await getImageDimensionsFromFixture(fixture, url);
				assert.equal(width, 600);
				assert.equal(height, 400);
			});
			const originalWidth = 2316;
			const originalHeight = 1544;
			it('does not upscale image if requested size is larger than original', async () => {
				const url = new URL(src);
				url.searchParams.set('w', '3000');
				url.searchParams.set('h', '2000');
				const { width, height } = await getImageDimensionsFromFixture(fixture, url);
				assert.equal(width, originalWidth);
				assert.equal(height, originalHeight);
			});

			// To match old behavior, we should upscale if the requested size is larger than the original
			it('does upscale image if requested size is larger than original and fit is unset', async () => {
				const url = new URL(src);
				url.searchParams.set('w', '3000');
				url.searchParams.set('h', '2000');
				url.searchParams.delete('fit');
				const { width, height } = await getImageDimensionsFromFixture(fixture, url);
				assert.equal(width, 3000);
				assert.equal(height, 2000);
			})

			// To match old behavior, we should upscale if the requested size is larger than the original
			it('does not upscale is only one dimension is provided and fit is set', async () => {
				const url = new URL(src);
				url.searchParams.set('w', '3000');
				url.searchParams.delete('h');
				url.searchParams.set('fit', 'cover');
				const { width, height } = await getImageDimensionsFromFixture(fixture, url);
				assert.equal(width, originalWidth);
				assert.equal(height, originalHeight);
			})
		});

	});

});
