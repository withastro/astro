import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('Server islands', () => {
	describe('SSR', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/server-islands/ssr',
				adapter: testAdapter(),
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

			it('omits the islands HTML', async () => {
				const res = await fixture.fetch('/');
				assert.equal(res.status, 200);
				const html = await res.text();
				const $ = cheerio.load(html);
				const serverIslandEl = $('h2#island');
				assert.equal(serverIslandEl.length, 0);
			});
		});

		describe('prod', () => {
			before(async () => {
				await fixture.build();
			});

			it('omits the islands HTML', async () => {
				const app = await fixture.loadTestAdapterApp();
				const request = new Request('http://example.com/');
				const response = await app.render(request);
				const html = await response.text();

				const $ = cheerio.load(html);
				const serverIslandEl = $('h2#island');
				assert.equal(serverIslandEl.length, 0);

				const serverIslandScript = $('script[data-island-id]');
				assert.equal(serverIslandScript.length, 1, 'has the island script');
			});
		});
	});

	describe('Hybrid mode', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/server-islands/hybrid',
				adapter: testAdapter(),
			});
		});

		describe('build', () => {
			before(async () => {
				await fixture.build();
			});

			it('Omits the island HTML from the static HTML', async () => {
				let html = await fixture.readFile('/client/index.html');

				const $ = cheerio.load(html);
				const serverIslandEl = $('h2#island');
				assert.equal(serverIslandEl.length, 0);

				const serverIslandScript = $('script[data-island-id]');
				assert.equal(serverIslandScript.length, 1, 'has the island script');
			});
		});
	});
});
