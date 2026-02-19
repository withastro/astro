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

			// There are 2 code blocks in index.md (yaml and diff)
			assert.equal($('pre').length, 2);
			const yamlBlock = $('pre').first();
			assert.ok(yamlBlock.hasClass('astro-code'));
			// Styles are now class-based - no inline styles
			assert.ok(yamlBlock.hasClass('astro-code-overflow'), 'has overflow class');
			assert.ok(!yamlBlock.attr('style'), 'should have no inline style attribute');
		});

		it('Can render diff syntax with "user-select: none"', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			// The diff block is the second <pre> in index.html
			const diffBlock = $('pre').eq(1);
			const diffHtml = $.html(diffBlock);
			// user-select: none is now a class, not inline style
			assert.ok(diffHtml.includes(`<span class="astro-code-no-select">+</span>`));
			assert.ok(diffHtml.includes(`<span class="astro-code-no-select">-</span>`));
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
				// Styles are now class-based - no inline styles
				assert.ok($('pre').hasClass('astro-code-overflow'), 'has overflow class');
				assert.ok(!$('pre').attr('style'), 'should have no inline style attribute');
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

				// With class-based styles, ALL styles are in CSS classes (no inline styles)
				assert.ok(!$('pre').attr('style'), 'should have no inline style attribute');
				assert.ok($('pre').hasClass('astro-code-overflow'), 'has overflow class');

				// Verify styles are in the <style> tag
				const styleTag = $('style').html();
				assert.match(styleTag, /astro-code-overflow\{overflow-x:auto\}/);
				assert.match(styleTag, /background-color:#fdfdfe/i);
				assert.match(styleTag, /color:#4e5377/i);
			});
		});

		describe('Default color', async () => {
			let fixture;

			before(async () => {
				fixture = await loadFixture({ root: './fixtures/astro-markdown-shiki/default-color/' });
				await fixture.build();
			});

			it('Renders default color without themes', async () => {
				const html = await fixture.readFile('/index.html');
				const $ = cheerio.load(html);

				// With class-based styles, no inline styles at all
				const preStyle = $('pre').attr('style');
				assert.ok(!preStyle || preStyle.trim() === '', 'should have no inline style');
			});
		});
	});

	describe('Languages', () => {
		let fixture;
		let $;

		before(async () => {
			fixture = await loadFixture({ root: './fixtures/astro-markdown-shiki/langs/' });
			await fixture.build();
			const html = await fixture.readFile('/index.html');
			$ = cheerio.load(html);
		});

		it('custom language', async () => {
			const lang = $('.astro-code').get(0);
			const segments = $('.line', lang).get(6).children;
			assert.equal(segments.length, 2);
			// With class-based styles, colors are in classes, not inline styles
			assert.ok(segments[0].attribs.class, 'First segment should have class attribute');
			assert.ok(segments[1].attribs.class, 'Second segment should have class attribute');
		});

		it('handles unknown languages', () => {
			const unknownLang = $('.astro-code').get(1);
			// With class-based styles, background-color and color are in classes
			assert.ok(
				unknownLang.attribs.class,
				'Unknown language code block should have class attribute',
			);
		});

		it('handles lazy loaded languages', () => {
			const lang = $('.astro-code').get(2);
			const segments = $('.line', lang).get(0).children;
			assert.equal(segments.length, 7);
			// With class-based styles, colors are in classes, not inline styles
			// Just verify all segments have class attributes
			for (let i = 0; i < segments.length; i++) {
				assert.ok(segments[i].attribs.class, `Segment ${i} should have class attribute`);
			}
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
			const html = await fixtures.ifTrue.readFile('/index.html');
			const $ = cheerio.load(html);

			assert.equal($('pre').length, 1);
			// With class-based styles, all styles are in classes
			assert.ok($('pre').hasClass('astro-code-overflow'), 'has overflow class');
			assert.ok($('pre').hasClass('astro-code-wrap'), 'has wrap class');
			assert.ok(!$('pre').attr('style'), 'should have no inline style attribute');

			// Verify CSS is in style tag
			const styleTag = $('style').html();
			assert.match(styleTag, /astro-code-overflow\{overflow-x:auto\}/);
			assert.match(styleTag, /astro-code-wrap\{white-space:pre-wrap;word-wrap:break-word\}/);
		});

		it('Markdown file with wrap = false', async () => {
			const html = await fixtures.ifFalse.readFile('/index.html');
			const $ = cheerio.load(html);

			assert.equal($('pre').length, 1);
			// With class-based styles, all styles are in classes
			assert.ok($('pre').hasClass('astro-code-overflow'), 'has overflow class');
			assert.ok(!$('pre').hasClass('astro-code-wrap'), 'should NOT have wrap class');
			assert.ok(!$('pre').attr('style'), 'should have no inline style attribute');
		});

		it('Markdown file with wrap = null', async () => {
			const html = await fixtures.ifNull.readFile('/index.html');
			const $ = cheerio.load(html);

			assert.equal($('pre').length, 1);
			// With class-based styles and no wrap config, there should be no inline style
			const preStyle = $('pre').attr('style');
			assert.ok(!preStyle || preStyle.trim() === '', 'Should have no inline style or empty style');
		});
	});
});
