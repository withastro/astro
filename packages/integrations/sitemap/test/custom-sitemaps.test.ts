import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { sitemap } from './fixtures/static/deps.mjs';
import { type Fixture, loadFixture, readXML } from './test-utils.ts';

describe('Custom sitemaps', () => {
	let fixture: Fixture;
	let sitemaps: { loc: string; lastmod: string }[];

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/static/',
			integrations: [
				sitemap({
					lastmod: new Date(),
					customSitemaps: ['http://example.com/custom-sitemap.xml'],
				}),
			],
		});
		await fixture.build();
		const data = await readXML(fixture.readFile('/sitemap-index.xml'));
		sitemaps = data.sitemapindex.sitemap.map((s: { loc: string[]; lastmod: string[] }) => ({
			loc: s.loc[0],
			lastmod: s.lastmod[0],
		}));
	});

	it('includes defined custom sitemaps', async () => {
		assert.equal(
			sitemaps.some((s) => s.loc === 'http://example.com/custom-sitemap.xml'),
			true,
		);
	});

	it('includes lastmod for sitemaps', async () => {
		assert.equal(
			sitemaps.every((s) => typeof s.lastmod === 'string'),
			true,
		);
	});
});
