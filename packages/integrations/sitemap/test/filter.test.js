import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { sitemap } from './fixtures/static/deps.mjs';
import { loadFixture, readXML } from './test-utils.js';

describe('Filter support', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	describe('Static', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/static/',
				integrations: [
					sitemap({
						filter: (page) => page === 'http://example.com/one/',
					}),
				],
			});
			await fixture.build();
		});

		it('Just one page is added', async () => {
			const data = await readXML(fixture.readFile('/sitemap-0.xml'));
			const urls = data.urlset.url;
			assert.equal(urls.length, 1);
		});
	});

	describe('SSR', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/ssr/',
				integrations: [
					sitemap({
						filter: (page) => page === 'http://example.com/one/',
					}),
				],
			});
			await fixture.build();
		});

		it('Just one page is added', async () => {
			const data = await readXML(fixture.readFile('/client/sitemap-0.xml'));
			const urls = data.urlset.url;
			assert.equal(urls.length, 1);
		});
	});
});
