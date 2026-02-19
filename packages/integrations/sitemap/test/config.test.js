import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { sitemap } from './fixtures/static/deps.mjs';
import { loadFixture, readXML } from './test-utils.js';

describe('Config', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	describe('Static', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/static/',
				integrations: [
					sitemap({
						filter: (page) => page === 'http://example.com/one/',
						xslURL: '/sitemap.xsl',
					}),
				],
			});
			await fixture.build();
		});

		it('filter: Just one page is added', async () => {
			const data = await readXML(fixture.readFile('/sitemap-0.xml'));
			const urls = data.urlset.url;
			assert.equal(urls.length, 1);
		});

		it('xslURL: Includes xml-stylesheet', async () => {
			const indexXml = await fixture.readFile('/sitemap-index.xml');
			assert.ok(
				indexXml.includes(
					'<?xml-stylesheet type="text/xsl" href="http://example.com/sitemap.xsl"?>',
				),
				indexXml,
			);

			const xml = await fixture.readFile('/sitemap-0.xml');
			assert.ok(
				xml.includes('<?xml-stylesheet type="text/xsl" href="http://example.com/sitemap.xsl"?>'),
				xml,
			);
		});
	});

	describe('SSR', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/ssr/',
				integrations: [
					sitemap({
						filter: (page) => page === 'http://example.com/one/',
						xslURL: '/sitemap.xsl',
					}),
				],
			});
			await fixture.build();
		});

		it('filter: Just one page is added', async () => {
			const data = await readXML(fixture.readFile('/client/sitemap-0.xml'));
			const urls = data.urlset.url;
			assert.equal(urls.length, 1);
		});

		it('xslURL: Includes xml-stylesheet', async () => {
			const indexXml = await fixture.readFile('/client/sitemap-index.xml');
			assert.ok(
				indexXml.includes(
					'<?xml-stylesheet type="text/xsl" href="http://example.com/sitemap.xsl"?>',
				),
				indexXml,
			);

			const xml = await fixture.readFile('/client/sitemap-0.xml');
			assert.ok(
				xml.includes('<?xml-stylesheet type="text/xsl" href="http://example.com/sitemap.xsl"?>'),
				xml,
			);
		});
	});

	describe('Configuring the filename', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/static/',
				integrations: [
					sitemap({
						filter: (page) => page === 'http://example.com/one/',
						filenameBase: 'my-sitemap',
					}),
				],
			});
			await fixture.build();
		});

		it('filenameBase: Sets the generated sitemap filename', async () => {
			const data = await readXML(fixture.readFile('/my-sitemap-0.xml'));
			const urls = data.urlset.url;
			assert.equal(urls.length, 1);

			const indexData = await readXML(fixture.readFile('/my-sitemap-index.xml'));
			const sitemapUrls = indexData.sitemapindex.sitemap;
			assert.equal(sitemapUrls.length, 1);
			assert.equal(sitemapUrls[0].loc[0], 'http://example.com/my-sitemap-0.xml');
		});
	});

	describe('Filtering pages - error handling', () => {
		it('filter: uncaught errors are thrown', async () => {
			fixture = await loadFixture({
				root: './fixtures/static/',
				integrations: [
					sitemap({
						filter: () => {
							throw new Error('filter error');
						},
					}),
				],
			});
			await assert.rejects(fixture.build(), /^Error: filter error$/);
		});
	});
});
