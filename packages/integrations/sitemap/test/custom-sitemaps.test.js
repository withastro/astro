import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { sitemap } from './fixtures/static/deps.mjs';
import { loadFixture, readXML } from './test-utils.js';

describe('Custom sitemaps', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;
	/** @type {string[]} */
	let urls;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/static/',
			integrations: [
				sitemap({
					customSitemaps: ['http://example.com/custom-sitemap.xml'],
				}),
			],
		});
		await fixture.build();
		const data = await readXML(fixture.readFile('/sitemap-index.xml'));
		urls = data.sitemapindex.sitemap.map((s) => s.loc[0]);
	});

	it('includes defined custom sitemaps', async () => {
		assert.equal(urls.includes('http://example.com/custom-sitemap.xml'), true);
	});
});
