import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture, readXML } from './test-utils.js';

describe('i18n fallback', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;
	/** @type {string[]} */
	let urls;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/i18n-fallback/',
		});
		await fixture.build();
		const data = await readXML(fixture.readFile('/sitemap-0.xml'));
		urls = data.urlset.url.map((url) => url.loc[0]);
	});

	it('includes default locale pages', async () => {
		assert.equal(urls.includes('http://example.com/'), true);
		assert.equal(urls.includes('http://example.com/about/'), true);
	});

	it('includes fallback locale pages', async () => {
		assert.equal(urls.includes('http://example.com/fr/'), true);
		assert.equal(urls.includes('http://example.com/fr/about/'), true);
	});
});
