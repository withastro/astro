import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('User routes have priority over internal routes', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		const root = './fixtures/user-route-priority/';
		fixture = await loadFixture({
			root,
			output: 'server',
			adapter: testAdapter(),
		});
		await fixture.build();
	});

	async function fetchHTML(path) {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com' + path);
		const response = await app.render(request);
		const html = await response.text();
		return html;
	}

	it("Page doesn't error with non-404 as number", async () => {
		const html = await fetchHTML('/123');
		const $ = cheerioLoad(html);
		assert.equal($('h1').text(), '123');
	});

	it("Page doesn't error with 404 as number", async () => {
		const html = await fetchHTML('/404');
		const $ = cheerioLoad(html);
		assert.equal($('h1').text(), '404');
	});
});
