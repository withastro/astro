import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Astro Markdown Shiki', () => {
	describe('Render shiki', () => {
		let fixture;

		before(async () => {
			fixture = await loadFixture({ root: './fixtures/astro-markdown-shiki/normal/' });
			await fixture.build();
		});

		it('Can render markdown with shiki', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			// There should be no HTML from Prism
			assert.equal($('.token').length, 0);

			assert.equal($('pre').length, 2);
			assert.ok($('pre').hasClass('astro-code'));
			assert.equal(
				$('pre').attr().style,
				'background-color:#24292e;color:#e1e4e8; overflow-x: auto;'
			);
		});

		it('Can render diff syntax with "user-select: none"', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			const diffBlockHtml = $('pre').last().html();
			assert.ok(diffBlockHtml.includes(`<span style="user-select: none;">+</span>`));
			assert.ok(diffBlockHtml.includes(`<span style="user-select: none;">-</span>`));
		});
	});

	describe('Themes', () => {
		describe('Integrated theme', async () => {
			let fixture;

			before(async () => {
				fixture = await loadFixture({ root: './fixtures/astro-markdown-shiki/themes-integrated/' });
				await fixture.build();
			});

			it('Markdown file', async () => {
				const html = await fixture.readFile('/index.html');
				const $ = cheerio.load(html);

				assert.equal($('pre').length, 1);
				assert.ok($('pre').hasClass('astro-code'));
				assert.equal(
					$('pre').attr().style,
					'background-color:#fff;color:#24292e; overflow-x: auto;'
				);
			});
		});

		describe('Custom theme', async () => {
			let fixture;

			before(async () => {
				fixture = await loadFixture({ root: './fixtures/astro-markdown-shiki/themes-custom/' });
				await fixture.build();
			});

			it('Markdown file', async () => {
				const html = await fixture.readFile('/index.html');
				const $ = cheerio.load(html);

				assert.equal($('pre').length, 1);
				assert.ok($('pre').hasClass('astro-code'));
				assert.equal(
					$('pre').attr().style,
					'background-color:#FDFDFE;color:#4E5377; overflow-x: auto;'
				);
			});
		});
	});

	describe('Custom langs', () => {
		let fixture;

		before(async () => {
			fixture = await loadFixture({ root: './fixtures/astro-markdown-shiki/langs/' });
			await fixture.build();
		});

		it('Markdown file', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			const segments = $('.line').get(6).children;
			assert.equal(segments.length, 2);
			assert.equal(segments[0].attribs.style, 'color:#79B8FF');
			assert.equal(segments[1].attribs.style, 'color:#E1E4E8');

			const unknownLang = $('.astro-code').get(1);
			assert.ok(unknownLang.attribs.style.includes('background-color:#24292e;color:#e1e4e8;'));
		});
	});

	describe('Wrapping behaviours', () => {
		let fixtures = {
			ifTrue: null,
			ifFalse: null,
			ifNull: null,
		};

		before(async () => {
			fixtures.ifTrue = await loadFixture({
				root: './fixtures/astro-markdown-shiki/wrap-true/',
			});
			fixtures.ifFalse = await loadFixture({
				root: './fixtures/astro-markdown-shiki/wrap-false/',
			});
			fixtures.ifNull = await loadFixture({
				root: './fixtures/astro-markdown-shiki/wrap-null/',
			});
			await fixtures.ifTrue.build();
			await fixtures.ifFalse.build();
			await fixtures.ifNull.build();
		});

		it('Markdown file with wrap = true', async () => {
			const style =
				'background-color:#24292e;color:#e1e4e8; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;';
			const html = await fixtures.ifTrue.readFile('/index.html');
			const $ = cheerio.load(html);

			assert.equal($('pre').length, 1);
			assert.equal($('pre').attr('style'), style);
		});

		it('Markdown file with wrap = false', async () => {
			const style = 'background-color:#24292e;color:#e1e4e8; overflow-x: auto;';
			const html = await fixtures.ifFalse.readFile('/index.html');
			const $ = cheerio.load(html);

			assert.equal($('pre').length, 1);
			assert.equal($('pre').attr('style'), style);
		});

		it('Markdown file with wrap = null', async () => {
			const style = 'background-color:#24292e;color:#e1e4e8';
			const html = await fixtures.ifNull.readFile('/index.html');
			const $ = cheerio.load(html);

			assert.equal($('pre').length, 1);
			assert.equal($('pre').attr('style'), style);
		});
	});
});
