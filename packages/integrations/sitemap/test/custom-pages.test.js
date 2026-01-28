import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { sitemap } from './fixtures/static/deps.mjs';
import { loadFixture, readXML } from './test-utils.js';

describe('Sitemap with custom pages', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;
	/** @type {string[]} */
	let urls;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/static/',
			integrations: [
				sitemap({
					customPages: ['http://example.com/custom-page'],
				}),
			],
		});
		await fixture.build();
		const data = await readXML(fixture.readFile('/sitemap-0.xml'));
		urls = data.urlset.url.map((url) => url.loc[0]);
	});

	it('includes defined custom pages', async () => {
		assert.equal(urls.includes('http://example.com/custom-page'), true);
	});
});
