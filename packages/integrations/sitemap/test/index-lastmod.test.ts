import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { sitemap } from './fixtures/static/deps.mjs';
import { type Fixture, loadFixture, readXML } from './test-utils.ts';

type IndexEntry = { loc: string; lastmod?: string };

async function readIndex(fixture: Fixture): Promise<IndexEntry[]> {
	const data = await readXML(fixture.readFile('/sitemap-index.xml'));
	return data.sitemapindex.sitemap.map((s: { loc: string[]; lastmod?: string[] }) => ({
		loc: s.loc[0],
		lastmod: s.lastmod?.[0],
	}));
}

describe('Sitemap index lastmod', () => {
	describe('Chunked sitemaps', () => {
		let entries: IndexEntry[];

		const BLOG_OLDER = '2024-02-01T00:00:00.000Z';
		const BLOG_NEWEST = '2024-09-15T00:00:00.000Z';
		const GLOSSARY_DATE = '2023-03-01T00:00:00.000Z';
		const FALLBACK = '2020-01-01T00:00:00.000Z';

		before(async () => {
			const fixture = await loadFixture({
				root: './fixtures/chunks/',
				integrations: [
					sitemap({
						lastmod: new Date(FALLBACK),
						chunks: {
							blog: (item) => {
								if (item.url.includes('blog')) {
									// Different blog URLs get different dates; the
									// index entry must surface the newest of them.
									item.lastmod = item.url.includes('two') ? BLOG_NEWEST : BLOG_OLDER;
									return item;
								}
							},
							glossary: (item) => {
								if (item.url.includes('glossary')) {
									item.lastmod = GLOSSARY_DATE;
									return item;
								}
							},
						},
					}),
				],
			});
			await fixture.build();
			entries = await readIndex(fixture);
		});

		const entryFor = (name: string) => entries.find((e) => e.loc.endsWith(name));

		it('stamps each entry with the newest lastmod in its child sitemap', () => {
			assert.equal(entryFor('sitemap-blog-0.xml')?.lastmod, BLOG_NEWEST);
			assert.equal(entryFor('sitemap-glossary-0.xml')?.lastmod, GLOSSARY_DATE);
		});

		it('falls back to the configured lastmod when a child has no per-URL lastmod', () => {
			assert.equal(entryFor('sitemap-pages-0.xml')?.lastmod, FALLBACK);
		});
	});

	describe('Non-chunked sitemaps split across multiple files', () => {
		let fixture: Fixture;
		let entries: IndexEntry[];

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/static/',
				integrations: [
					sitemap({
						// One URL per file, so each index entry maps to exactly
						// one child sitemap and the per-file slicing is exercised.
						entryLimit: 1,
						serialize(item) {
							const day = (item.url.length % 27) + 1;
							item.lastmod = new Date(Date.UTC(2024, 0, day)).toISOString();
							return item;
						},
					}),
				],
			});
			await fixture.build();
			entries = await readIndex(fixture);
		});

		it('gives each entry the lastmod of the child sitemap it points to', async () => {
			assert.ok(entries.length > 1, 'expected the sitemap to span multiple files');
			for (const entry of entries) {
				const childFile = `/${entry.loc.split('/').pop()}`;
				const child = await readXML(fixture.readFile(childFile));
				const childDates = (child.urlset.url ?? [])
					.map((u: { lastmod?: string[] }) => u.lastmod?.[0])
					.filter((d: string | undefined): d is string => Boolean(d))
					.map((d: string) => new Date(d).getTime());
				const expected =
					childDates.length > 0 ? new Date(Math.max(...childDates)).toISOString() : undefined;
				assert.equal(entry.lastmod, expected, `mismatch for ${entry.loc}`);
			}
		});
	});
});
