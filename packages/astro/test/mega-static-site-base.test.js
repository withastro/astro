import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Asset URL resolution in build', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	describe('With site and base', () => {
		describe('with site', () => {
			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/mega-static/',
					outDir: './dist/mega-static-site',
					vite: {
						cacheDir: './node_modules/.vite/mega-static-site',
					},
					site: 'http://example.com/sub/path/',
					// test suite was authored when inlineStylesheets defaulted to never
					build: { inlineStylesheets: 'never' },
				});
				await fixture.build();
			});

			it("does not include the site's subpath", async () => {
				const html = await fixture.readFile('/asset-url-base/index.html');
				const $ = cheerio.load(html);
				const href = $('link[rel=stylesheet]').attr('href');
				assert.ok(href);
				assert.equal(href.startsWith('/sub/path/'), false);
			});
		});

		describe('with site and base', () => {
			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/mega-static/',
					outDir: './dist/mega-static-site-base',
					vite: {
						cacheDir: './node_modules/.vite/mega-static-site-base',
					},
					site: 'http://example.com/sub/path/',
					base: '/another/base/',
					// test suite was authored when inlineStylesheets defaulted to never
					build: { inlineStylesheets: 'never' },
				});
				await fixture.build();
			});

			it("does not include the site's subpath", async () => {
				const html = await fixture.readFile('/asset-url-base/index.html');
				const $ = cheerio.load(html);
				const href = $('link[rel=stylesheet]').attr('href');
				assert.equal(href.startsWith('/sub/path/'), false);
			});

			it('does include the base subpath', async () => {
				const html = await fixture.readFile('/asset-url-base/index.html');
				const $ = cheerio.load(html);
				const href = $('link[rel=stylesheet]').attr('href');
				assert.equal(href.startsWith('/another/base/'), true);
			});
		});
	});
});
