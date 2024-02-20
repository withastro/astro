import { loadFixture, readXML } from './test-utils.js';
import { sitemap } from './fixtures/static/deps.mjs';
import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

describe('Prefix support', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;
	const prefix = 'test-';

	describe('Static', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/static/',
				integrations: [
					sitemap(),
					sitemap({
						prefix,
					}),
				],
			});
			await fixture.build();
		});

		it('Content is same', async () => {
			const data = await readXML(fixture.readFile('/sitemap-0.xml'));
			const prefixData = await readXML(fixture.readFile(`/${prefix}0.xml`));
			assert.deepEqual(prefixData, data);
		});

		it('Index file load correct sitemap', async () => {
			const data = await readXML(fixture.readFile('/sitemap-index.xml'));
			const sitemapUrl = data.sitemapindex.sitemap[0].loc[0];
			assert.strictEqual(sitemapUrl, 'http://example.com/sitemap-0.xml');

			const prefixData = await readXML(fixture.readFile(`/${prefix}index.xml`));
			const prefixSitemapUrl = prefixData.sitemapindex.sitemap[0].loc[0];
			assert.strictEqual(prefixSitemapUrl, `http://example.com/${prefix}0.xml`);
		});
	});

	describe('SSR', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/ssr/',
				integrations: [
					sitemap(),
					sitemap({
						prefix,
					}),
				],
			});
			await fixture.build();
		});

		it('Content is same', async () => {
			const data = await readXML(fixture.readFile('/client/sitemap-0.xml'));
			const prefixData = await readXML(fixture.readFile(`/client/${prefix}0.xml`));
			assert.deepEqual(prefixData, data);
		});

		it('Index file load correct sitemap', async () => {
			const data = await readXML(fixture.readFile('/client/sitemap-index.xml'));
			const sitemapUrl = data.sitemapindex.sitemap[0].loc[0];
			assert.strictEqual(sitemapUrl, 'http://example.com/sitemap-0.xml');

			const prefixData = await readXML(fixture.readFile(`/client/${prefix}index.xml`));
			const prefixSitemapUrl = prefixData.sitemapindex.sitemap[0].loc[0];
			assert.strictEqual(prefixSitemapUrl, `http://example.com/${prefix}0.xml`);
		});
	});
});
