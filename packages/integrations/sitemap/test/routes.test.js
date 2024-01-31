import { loadFixture, readXML } from './test-utils.js';
import * as assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';

describe('routes', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;
	/** @type {string[]} */
	let urls;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/static/',
		});
		await fixture.build();
		const data = await readXML(fixture.readFile('/sitemap-0.xml'));
		urls = data.urlset.url.map((url) => url.loc[0]);
	});

	it('does not include endpoints', async () => {
		assert.equal(urls.indexOf('http://example.com/endpoint.json'), -1);
	});

	it('does not include redirects', async () => {
		assert.equal(urls.indexOf('http://example.com/endpoint.json'), -1);
	});
});
