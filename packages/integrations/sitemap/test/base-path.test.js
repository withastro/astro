import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture, readXML } from './test-utils.js';

describe('URLs with base path', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	describe('using node adapter', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/ssr/',
				base: '/base',
			});
			await fixture.build();
		});

		it('Base path is concatenated correctly', async () => {
			const data = await readXML(fixture.readFile('/client/sitemap-0.xml'));
			const urls = data.urlset.url;
			assert.equal(urls[0].loc[0], 'http://example.com/base/one/');
		});
	});

	describe('static', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/static/',
				base: '/base',
			});
			await fixture.build();
		});

		it('Base path is concatenated correctly', async () => {
			const data = await readXML(fixture.readFile('/sitemap-0.xml'));
			const urls = data.urlset.url;
			assert.equal(urls[0].loc[0], 'http://example.com/base/123/');
		});
	});
});
