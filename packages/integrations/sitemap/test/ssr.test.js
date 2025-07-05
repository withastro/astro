import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture, readXML } from './test-utils.js';

describe('SSR support', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;
	/** @type {string[]} */
	let urls;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr/',
		});
		await fixture.build();

		const data = await readXML(fixture.readFile('/client/sitemap-0.xml'));
		urls = data.urlset.url.map((url) => url.loc[0]);
	});

	it('SSR pages require zero config', async () => {
		assert.equal(urls.includes('http://example.com/one/'), true);
		assert.equal(urls.includes('http://example.com/two/'), true);
	});

	it('Should generate correct urls with custom pages in SSR', async () => {
		assert.ok(urls.includes('http://example.com/solutions/'));
		assert.ok(urls.includes('http://example.com/solutions/one/'));
		assert.ok(urls.includes('http://example.com/solutions/two/'));
	});
});
