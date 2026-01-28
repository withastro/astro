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
						return item;
					},
					chunks: {
						blog: (item) => {
							if (item.url.includes('blog')) {
								item.changefreq = 'weekly';
								item.lastmod = new Date();
								item.priority = 0.9;
								return item;
							}
						},
						glossary: (item) => {
							if (item.url.includes('glossary')) {
								item.changefreq = 'weekly';
								item.lastmod = new Date();
								item.priority = 0.9;
								return item;
							}
						},
					},
				}),
			],
		});
		await fixture.build();
		const flatMapUrls = async (file) => {
			const data = await readXML(fixture.readFile(file));
			return data.urlset.url.map((url) => url.loc[0]);
		};
		blogUrls = await flatMapUrls('sitemap-blog-0.xml');
		glossaryUrls = await flatMapUrls('sitemap-glossary-0.xml');
		pagesUrls = await flatMapUrls('sitemap-pages-0.xml');
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
