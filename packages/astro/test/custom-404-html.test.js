import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Custom 404.html', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/custom-404-html/',
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

			assert.equal($('h1').text(), 'Home');
		});

		it('renders 404 for /a', async () => {
			const res = await fixture.fetch('/a');
			assert.equal(res.status, 404);

			const html = await res.text();
			$ = cheerio.load(html);

			assert.equal($('h1').text(), 'Page not found');
			assert.equal($('p').text(), 'This 404 is a static HTML file.');
		});
	});
});
