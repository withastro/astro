import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Image', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/image/',
		});
		await fixture.build();
	});

	it('build successful', async () => {
		assert.ok(await fixture.readFile('../.vercel/output/static/index.html'));
	});

	it('has link to vercel in build with proper attributes', async () => {
		const html = await fixture.readFile('../.vercel/output/static/index.html');
		const $ = cheerio.load(html);
		const img = $('#basic-image img');

		assert.equal(img.attr('src').startsWith('/_vercel/image?url=_astr'), true);
		assert.equal(img.attr('loading'), 'lazy');
		assert.equal(img.attr('width'), '225');
	});

	it('generates valid image sizes when requested width is larger than source image', async () => {
		const html = await fixture.readFile('../.vercel/output/static/index.html');
		const $ = cheerio.load(html);
		const img = $('#small-source img');
		const widths = img
			.attr('srcset')
			.split(', ')
			.map((entry) => entry.split(' ')[1]);
		assert.deepEqual(widths, ['640w'], 'uses valid widths in srcset');

		const url = new URL(img.attr('src'), 'http://localhost');
		assert.equal(url.searchParams.get('w'), '640', 'uses valid width in src');

		assert.equal(img.attr('width'), '225', 'uses requested width in img attribute');
	});

	it('generates valid densities-based srcset using only configured sizes', async () => {
		const html = await fixture.readFile('../.vercel/output/static/index.html');
		const $ = cheerio.load(html);
		const img = $('#densities-test img');
		const srcset = img.attr('srcset');

		// Extract widths from srcset (format: "url 1x", "url 1.5x", etc)
		const descriptors = srcset.split(', ').map((entry) => entry.split(' ')[1]);

		// Extract the widths from the URLs (they should be valid configured sizes)
		const urls = srcset.split(', ').map((entry) => entry.split(' ')[0]);
		const widthsFromUrls = urls.map((url) => {
			const urlObj = new URL(url, 'http://localhost');
			return parseInt(urlObj.searchParams.get('w'), 10);
		});

		// The configured sizes are [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
		// width=600 with densities [1, 1.5, 2] would calculate [600, 900, 1200]
		// 600 -> nearest is 640
		// 900 -> nearest is 828
		// 1200 -> exactly in configured sizes
		// So we expect widths [640, 828, 1200]
		assert.deepEqual(
			widthsFromUrls.sort((a, b) => a - b),
			[640, 828, 1200],
			`widths are mapped to nearest configured sizes`,
		);

		// All widths should be from the configured sizes
		assert.ok(
			widthsFromUrls.every((w) => [640, 750, 828, 1080, 1200, 1920, 2048, 3840].includes(w)),
			`all widths in srcset are from configured sizes: ${widthsFromUrls}`,
		);

		// Check that we have density descriptors
		assert.ok(
			descriptors.every((d) => /^\d+(\.\d+)?x$/.exec(d)),
			`all descriptors are density-based (e.g., 1x, 1.5x): ${descriptors}`,
		);
	});

	it('has proper vercel config', async () => {
		const vercelConfig = JSON.parse(await fixture.readFile('../.vercel/output/config.json'));

		assert.deepEqual(vercelConfig.images, {
			sizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
			domains: ['astro.build'],
			remotePatterns: [
				{
					protocol: 'https',
					hostname: '**.amazonaws.com',
				},
			],
		});
	});

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('has link to local image in dev with proper attributes', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerio.load(html);
			const img = $('#basic-image img');

			assert.equal(img.attr('src').startsWith('/_image?href='), true);
			assert.equal(img.attr('loading'), 'lazy');
			assert.equal(img.attr('width'), '225');
		});

		it('supports SVGs', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerio.load(html);
			const img = $('#svg img');
			const src = img.attr('src');

			const res = await fixture.fetch(src);
			assert.equal(res.status, 200);
			assert.equal(res.headers.get('content-type'), 'image/svg+xml');
		});

		it('generates valid srcset for responsive images', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerio.load(html);
			const img = $('#responsive img');
			const widths = img
				.attr('srcset')
				.split(', ')
				.map((entry) => entry.split(' ')[1]);
			assert.deepEqual(widths, ['640w', '750w', '828w', '1080w', '1200w', '1920w']);
		});
	});
});
