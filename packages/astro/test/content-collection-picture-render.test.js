import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

// Regression test for https://github.com/withastro/astro/issues/16036
// Using the <Picture> component on a prerendered page combined with render()
// on content collection entries caused a TDZ error during build:
// "ReferenceError: Cannot access '$$Picture' before initialization"
describe('Content collection with Picture component and render()', () => {
	/** @type {import("./test-utils.js").Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/content-collection-picture-render/' });
	});

	describe('Build', () => {
		before(async () => {
			await fixture.build();
		});

		it('successfully builds pages using the Picture component', async () => {
			const html = await fixture.readFile('/index.html');
			assert.ok(html, 'Expected index page to be generated');

			const $ = cheerio.load(html);
			const $picture = $('picture');
			assert.ok($picture.length, 'Expected <picture> element to be rendered');
		});

		it('successfully builds content collection pages with render()', async () => {
			const html = await fixture.readFile('/blog/post-1/index.html');
			assert.ok(html, 'Expected blog page to be generated');

			const $ = cheerio.load(html);
			assert.equal($('.title').text(), 'Post One');
		});

		it('resolves cover image in content collection entry', async () => {
			const html = await fixture.readFile('/blog/post-1/index.html');
			const $ = cheerio.load(html);

			const $img = $('.cover');
			assert.ok($img.attr('src'), 'Expected cover image to have a src');
		});

		it('renders content body from content collection entry', async () => {
			const html = await fixture.readFile('/blog/post-1/index.html');
			const $ = cheerio.load(html);

			const $content = $('.content');
			assert.ok($content.length, 'Expected content div to be present');
			assert.ok($content.text().includes('Hello world'), 'Expected rendered markdown content');
		});
	});
});
