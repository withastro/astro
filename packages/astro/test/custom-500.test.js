import assert from 'node:assert/strict';
import { afterEach, before, beforeEach, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';

describe('Custom 500', () => {
	/** @type {Awaited<ReturnType<typeof loadFixture>>} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/custom-500/',
			output: 'server',
			adapter: testAdapter(),
		});
	});

	describe('dev', () => {
		let devServer;

		beforeEach(async () => {
			devServer = await fixture.startDevServer();
		});

		afterEach(async () => {
			await devServer.stop();
			delete process.env.ASTRO_CUSTOM_500;
		});

		it('renders default error overlay', async () => {
			const response = await fixture.fetch('/');
			assert.equal(response.status, 500);

			const html = await response.text();

			assert.equal(html, '<title>Error</title><script type="module" src="/@vite/client"></script>');
		});

		it('renders custom 500', async () => {
			process.env.ASTRO_CUSTOM_500 = 'true';

			const response = await fixture.fetch('/');
			assert.equal(response.status, 500);

			const html = await response.text();
			const $ = cheerio.load(html);

			assert.equal($('h1').text(), 'Server error');
			assert.equal($('p').text(), 'some error');
		});
	});

	describe('SSR', () => {
		/** @type {Awaited<ReturnType<(typeof fixture)["loadTestAdapterApp"]>>} */
		let app;

		before(async () => {
			await fixture.build();
			app = await fixture.loadTestAdapterApp();
		});

		it('renders custom 500', async () => {
			const request = new Request('http://example.com/');
			const response = await app.render(request)
			assert.equal(response.status, 500);

			const html = await response.text();
			const $ = cheerio.load(html);

			assert.equal($('h1').text(), 'Server error');
			assert.equal($('p').text(), 'some error');
		});
	});
});
