import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { sitemap } from './fixtures/static/deps.mjs';
import { loadFixture, readXML } from './test-utils.js';

describe('Sitemap with chunked files', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;
	/** @type {string[]} */
	let blogUrls;
	let glossaryUrls;
	let pagesUrls;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/chunks/',
			integrations: [
				sitemap({
					serialize(item) {
						return item
					},
					chunks: {
						'blog': (item) => {
							if (/blog/.test(item.url)) {
								item.changefreq = 'weekly';
								item.lastmod = new Date();
								item.priority = 0.9;
								return item;
							}
						},
						'glossary': (item) => {
							if (/glossary/.test(item.url)) {
								item.changefreq = 'weekly';
								item.lastmod = new Date();
								item.priority = 0.9;
								return item;
							}
						}
					},
				}),
			],
		});
		await fixture.build();
		const [blogUrlsRaw, glossaryUrlsRaw, pagesUrlsRaw] = await Promise.all([
			readXML(fixture.readFile('/sitemap-blog-0.xml')),
			readXML(fixture.readFile('/sitemap-glossary-0.xml')),
			readXML(fixture.readFile('/sitemap-pages-0.xml')),
		]);
		const flatMapUrls = (data) => data.urlset.url.map((url) => url.loc[0])
		blogUrls = flatMapUrls(blogUrlsRaw);
		glossaryUrls = flatMapUrls(glossaryUrlsRaw)
		pagesUrls = flatMapUrls(pagesUrlsRaw)
	});

	it('includes defined custom pages', async () => {
		assert.equal(blogUrls.includes('http://example.com/blog/one/'), true);
		assert.equal(blogUrls.includes('http://example.com/blog/two/'), true);
		assert.equal(glossaryUrls.includes('http://example.com/glossary/one/'), true);
		assert.equal(glossaryUrls.includes('http://example.com/glossary/two/'), true);
		assert.equal(pagesUrls.includes('http://example.com/one/'), true);
		assert.equal(pagesUrls.includes('http://example.com/two/'), true);
	});
});
