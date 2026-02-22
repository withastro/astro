import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

// Regression test for https://github.com/withastro/astro/issues/15575
// SVG images in content collection image() fields combined with top-level await
// caused a circular module dependency deadlock during build.
describe('Content collection with SVG image and TLA', () => {
	/** @type {import("./test-utils.js").Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/content-collection-tla-svg/' });
	});

	describe('Build', () => {
		before(async () => {
			await fixture.build();
		});

		it('successfully builds pages using TLA with getCollection()', async () => {
			const html = await fixture.readFile('/index.html');
			assert.ok(html, 'Expected page to be generated');

			const $ = cheerio.load(html);
			assert.equal($('.title').first().text(), 'Article One');
		});

		it('resolves SVG image as metadata in content collection', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			const $img = $('.cover').first();
			assert.ok($img.attr('src'), 'Expected cover image to have a src');
			assert.equal($img.attr('width'), '100');
			assert.equal($img.attr('height'), '100');
		});
	});
});
