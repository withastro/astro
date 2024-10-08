import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture, readXML } from './test-utils.js';

describe('i18n-rewrite', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;
	/** @type {string[]} */
	let urls;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/static/',
			i18n: {
				defaultLocale: 'it',
				locales: ['it', 'de'],
				routing: {
					fallbackType: 'rewrite',
				},
			},
		});
		await fixture.build();

		const data = await readXML(fixture.readFile('/sitemap-0.xml'));
		urls = data.urlset.url.map((url) => url.loc[0]);
	});

	it('includes internationalized for getStaticPaths', async () => {
		assert.equal(urls.includes('http://example.com/de/one/'), true);
		assert.equal(urls.includes('http://example.com/de/two/'), true);
	});

	it('includes internationalized for numerical pages', () => {
		assert.equal(urls.includes('http://example.com/de/123/'), true);
	});

	it('includes internationalized numerical 404 pages if not for i18n', () => {
		assert.equal(urls.includes('http://example.com/de/products-by-id/405/'), true);
		assert.equal(urls.includes('http://example.com/de/products-by-id/404/'), true);
	});
});
