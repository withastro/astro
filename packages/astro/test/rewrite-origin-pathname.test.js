import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('Rewrite origin pathname with trailing slash', () => {
	describe('trailingSlash: always', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/rewrite-origin-pathname-always/',
				trailingSlash: 'always',
			});
			await fixture.build();
		});

		it('should have trailing slash in canonical URL after rewrite', async () => {
			const html = await fixture.readFile('/about/index.html');
			const $ = cheerioLoad(html);
			assert.equal($('link[rel="canonical"]').attr('href'), 'https://example.com/about/');
		});
	});

	describe('trailingSlash: never', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/rewrite-origin-pathname-never/',
				trailingSlash: 'never',
				build: {
					format: 'file',
				},
			});
			await fixture.build();
		});

		it('should not have trailing slash in canonical URL after rewrite', async () => {
			const html = await fixture.readFile('/about.html');
			const $ = cheerioLoad(html);
			assert.equal($('link[rel="canonical"]').attr('href'), 'https://example.com/about');
		});
	});

	describe('trailingSlash: ignore with directory format', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/rewrite-origin-pathname-ignore-directory/',
				trailingSlash: 'ignore',
				build: {
					format: 'directory',
				},
			});
			await fixture.build();
		});

		it('should have trailing slash in canonical URL after rewrite', async () => {
			const html = await fixture.readFile('/about/index.html');
			const $ = cheerioLoad(html);
			assert.equal($('link[rel="canonical"]').attr('href'), 'https://example.com/about/');
		});
	});

	describe('trailingSlash: ignore with file format', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/rewrite-origin-pathname-ignore-file/',
				trailingSlash: 'ignore',
				build: {
					format: 'file',
				},
			});
			await fixture.build();
		});

		it('should not have trailing slash in canonical URL after rewrite', async () => {
			const html = await fixture.readFile('/about.html');
			const $ = cheerioLoad(html);
			assert.equal($('link[rel="canonical"]').attr('href'), 'https://example.com/about');
		});
	});
});