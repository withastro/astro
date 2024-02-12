import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import assert from 'node:assert/strict';
import { after, describe, before, it } from 'node:test';

describe('Custom 404 with injectRoute', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/custom-404-injected/',
			site: 'http://example.com',
		});
	});

	describe('dev', () => {
		let devServer;
		let $;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('renders /', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			$ = cheerio.load(html);

			assert.strictEqual($('h1').text(), 'Home');
		});

		it('renders 404 for /a', async () => {
			const res = await fixture.fetch('/a');
			assert.strictEqual(res.status, 404);

			const html = await res.text();
			$ = cheerio.load(html);

			assert.strictEqual($('h1').text(), 'Page not found');
			assert.strictEqual($('p').text(), '/a');
		});
	});
});
