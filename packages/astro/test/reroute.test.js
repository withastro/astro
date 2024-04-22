import { describe, it, before, after } from 'node:test';
import { loadFixture } from './test-utils.js';
import { load as cheerioLoad } from 'cheerio';
import assert from 'node:assert/strict';

describe('Dev reroute', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/reroute/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('the render the index page when navigating /reroute ', async () => {
		const html = await fixture.fetch('/reroute').then((res) => res.text());
		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Index');
	});

	it('the render the index page when navigating /blog/hello ', async () => {
		const html = await fixture.fetch('/blog/hello').then((res) => res.text());
		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Index');
	});

	it('the render the index page when navigating /blog/salut ', async () => {
		const html = await fixture.fetch('/blog/hello').then((res) => res.text());
		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Index');
	});
});
