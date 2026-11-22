import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { EnumChangefreq } from 'sitemap';
import { sitemap } from './fixtures/static/deps.mjs';
import { type Fixture, loadFixture, readXML } from './test-utils.ts';

describe('Sitemap with chunked files', () => {
	let fixture: Fixture;
	let blogUrls: string[];
	let glossaryUrls: string[];
	let canonicalUrls: string[];
	let pagesUrls: string[];

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/chunks/',
			outDir: './temp/chunks-files/',
			integrations: [
				sitemap({
					serialize(item) {
						return item;
					},
					chunks: {
						blog: (item) => {
							if (item.url.includes('blog')) {
								item.changefreq = EnumChangefreq.WEEKLY;
								// @ts-expect-error - a string is expected but the original JS code assigns a Date object here
								item.lastmod = new Date();
								item.priority = 0.9;
								return item;
							}
						},
						glossary: (item) => {
							if (item.url.includes('glossary')) {
								item.changefreq = EnumChangefreq.WEEKLY;
								// @ts-expect-error - a string is expected but the original JS code assigns a Date object here
								item.lastmod = new Date();
								item.priority = 0.9;
								return item;
							}
						},
						canonical: async (item) => {
							if (item.url === 'http://example.com/123/') {
								return { ...item, url: 'http://example.com/canonical/123/' };
							}
						},
						pages: (item) => {
							if (item.url === 'http://example.com/blog/one/') {
								return { ...item, url: 'http://example.com/canonical/blog/one/' };
							}
						},
					},
				}),
			],
		});
		await fixture.build();
		const flatMapUrls = async (file: string) => {
			const data = await readXML(fixture.readFile(file));
			return data.urlset.url.map((url: { loc: string[] }) => url.loc[0]);
		};
		blogUrls = await flatMapUrls('sitemap-blog-0.xml');
		glossaryUrls = await flatMapUrls('sitemap-glossary-0.xml');
		canonicalUrls = await flatMapUrls('sitemap-canonical-0.xml');
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

	it('excludes the original URL from the default chunk when a callback returns a rewritten URL', () => {
		assert.deepEqual(canonicalUrls, ['http://example.com/canonical/123/']);
		assert.equal(pagesUrls.includes('http://example.com/123/'), false);
	});

	it('keeps entries from a custom pages chunk alongside unmatched entries', () => {
		assert.ok(pagesUrls.includes('http://example.com/canonical/blog/one/'));
		assert.ok(pagesUrls.includes('http://example.com/one/'));
		assert.ok(!pagesUrls.includes('http://example.com/blog/one/'));
	});
});
