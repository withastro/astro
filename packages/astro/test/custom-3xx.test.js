import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Custom 3xx page', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let $;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/custom-3xx/',
			site: 'http://example.com/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('shows custom 3xx page on redirect', async () => {
		const response = await fixture.fetch('/redirect-page');
		assert.equal(response.status, 302);

		const html = await response.text();
		$ = cheerio.load(html);
		assert.equal($('h1').text(), 'Custom Redirect Page');
		assert.ok(
			$('p.destination').text().includes('/destination'),
			'Location should contain /destination',
		);
		assert.equal($('p.status').text(), '302');
	});

	it('shows custom 3xx page on config-defined temporary redirect', async () => {
		const response = await fixture.fetch('/temp-redirect');
		assert.equal(response.status, 307);

		const html = await response.text();
		$ = cheerio.load(html);
		assert.equal($('h1').text(), 'Custom Redirect Page');
		assert.ok(
			$('p.destination').text().includes('/destination'),
			'Location should contain /destination',
		);
		assert.equal($('p.status').text(), '307');
	});
});
