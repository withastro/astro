import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import type { RehypePlugin, RemarkPlugin } from '@astrojs/markdown-remark';
import * as cheerio from 'cheerio';
import { type AstroInlineConfig, type Fixture, loadFixture } from './test-utils.ts';

const remarkExamplePlugin: RemarkPlugin = () => {
	return (tree) => {
		tree.children.push({
			type: 'paragraph',
			children: [{ type: 'text', value: 'Remark plugin applied!' }],
		});
	};
};

const addClasses: RehypePlugin = await (async () => {
	const importPath: string = './fixtures/astro-markdown-plugins/add-classes.mjs';
	const mod = await import(importPath);
	return mod.default;
})();

const defaultMarkdownConfig: AstroInlineConfig['markdown'] = {
	gfm: true,
	smartypants: true,
	remarkPlugins: [
		remarkExamplePlugin,
		'remark-code-titles',
		['rehype-autolink-headings', { behavior: 'prepend' }],
	],
	rehypePlugins: [
		'rehype-slug',
		['rehype-toc', { headings: ['h2', 'h3'] }],
		[addClasses, { 'h1,h2,h3': 'title' }],
	],
};

describe('Astro Markdown plugins', () => {
	describe('Default test plugins', () => {
		let fixture: Fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-markdown-plugins/',
				markdown: defaultMarkdownConfig,
				outDir: './dist/astro-markdown-plugins-default-test-plugins/',
			});
			await fixture.build();
		});

		it('Can render markdown with plugins', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			// test 1: Added a TOC
			assert.equal($('.toc').length, 1);

			// test 2: Added .title to h1
			assert.ok($('#hello-world').hasClass('title'));
		});

		// Asserts Astro 1.0 behavior is removed. Test can be removed in Astro 3.0.
		it('Still applies default plugins when user plugins are provided', async () => {
			const gfmHtml = await fixture.readFile('/with-gfm/index.html');
			const $1 = cheerio.load(gfmHtml);
			assert.equal($1('a[href="https://example.com"]').length, 1);

			const smartypantsHtml = await fixture.readFile('/with-smartypants/index.html');
			const $2 = cheerio.load(smartypantsHtml);
			assert.equal($2('p').html(), '“Smartypants” is — awesome …');

			testRemark(gfmHtml);
			testRehype(gfmHtml, '#github-flavored-markdown-test');
		});

		it(`Handles GFM when gfm = true`, async () => {
			const html = await fixture.readFile('/with-gfm/index.html');
			const $ = cheerio.load(html);

			// test 1: GFM autolink applied correctly
			assert.equal($('a[href="https://example.com"]').length, 1);

			testRemark(html);
			testRehype(html, '#github-flavored-markdown-test');
		});

		it(`Handles SmartyPants when smartypants = true`, async () => {
			const html = await fixture.readFile('/with-smartypants/index.html');
			const $ = cheerio.load(html);

			// test 1: smartypants applied correctly
			assert.equal($('p').html(), '“Smartypants” is — awesome …');

			testRemark(html);
			testRehype(html, '#smartypants-test');
		});
	});

	it(`Handles GFM when gfm = false`, async () => {
		const fixture = await loadFixture({
			root: './fixtures/astro-markdown-plugins/',
			markdown: { ...defaultMarkdownConfig, gfm: false },
			outDir: './dist/astro-markdown-plugins-default-test-plugins/',
		});
		await fixture.build();

		const html = await fixture.readFile('/with-gfm/index.html');
		const $ = cheerio.load(html);

		assert.equal($('a[href="https://example.com"]').length, 0);

		testRemark(html);
		testRehype(html, '#github-flavored-markdown-test');
	});

	it(`Handles SmartyPants when smartypants = false`, async () => {
		const fixture = await loadFixture({
			root: './fixtures/astro-markdown-plugins/',
			markdown: { ...defaultMarkdownConfig, smartypants: false },
			outDir: './dist/astro-markdown-plugins-default-test-plugins/',
		});
		await fixture.build();

		const html = await fixture.readFile('/with-smartypants/index.html');
		const $ = cheerio.load(html);

		assert.equal($('p').html(), '"Smartypants" is -- awesome ...');

		testRemark(html);
		testRehype(html, '#smartypants-test');
	});

	describe('content layer plugins', () => {
		let fixture: Fixture;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/content-layer-remark-plugins/',
				outDir: './dist/astro-markdown-plugins-content-layer-plugins/',
			});
			await fixture.build();
		});

		it('passes untransformed frontmatter to remark plugins', async () => {
			const html = await fixture.readFile('/test1/index.html');
			const $ = cheerio.load(html);
			assert.equal($('p').text(), 'Not transformed');
		});

		it('processes empty markdown content with remark plugins', async () => {
			const html = await fixture.readFile('/empty-content/index.html');
			const $ = cheerio.load(html);
			assert.equal($('h1').text(), 'Test Empty Markdown');
			assert.equal(
				$('#frontmatter-custom-property').text(),
				'Generated property via remark plugin!',
			);
		});
	});

	describe('Advanced Smartypants configurations', () => {
		it('Handles custom dashes (oldschool)', async () => {
			const fixture = await loadFixture({
				root: './fixtures/astro-markdown-plugins/',
				markdown: {
					...defaultMarkdownConfig,
					smartypants: { dashes: 'oldschool' },
				},
				outDir: './dist/astro-markdown-plugins-advanced-smartypants-configurations/',
			});
			await fixture.build();

			const html = await fixture.readFile('/with-smartypants/index.html');
			const $ = cheerio.load(html);

			// In 'oldschool', -- becomes en-dash (–) instead of em-dash (—)
			assert.equal($('p').html(), '“Smartypants” is – awesome …');
		});

		it('Handles disabled ellipses', async () => {
			const fixture = await loadFixture({
				root: './fixtures/astro-markdown-plugins/',
				markdown: {
					...defaultMarkdownConfig,
					smartypants: { ellipses: false },
				},
				outDir: './dist/astro-markdown-plugins-advanced-smartypants-configurations/',
			});
			await fixture.build();

			const html = await fixture.readFile('/with-smartypants/index.html');
			const $ = cheerio.load(html);

			// Dashes should still be smart (em-dash), but dots should remain dots
			assert.equal($('p').html(), '“Smartypants” is — awesome ...');
		});

		it('Handles custom opening and closing quotes', async () => {
			const fixture = await loadFixture({
				root: './fixtures/astro-markdown-plugins/',
				markdown: {
					...defaultMarkdownConfig,
					smartypants: {
						openingQuotes: { double: '«', single: '‹' },
						closingQuotes: { double: '»', single: '›' },
					},
				},
				outDir: './dist/astro-markdown-plugins-advanced-smartypants-configurations/',
			});
			await fixture.build();

			const html = await fixture.readFile('/with-smartypants/index.html');
			const $ = cheerio.load(html);

			// Verify the custom guillemets are used
			assert.equal($('p').html(), '«Smartypants» is — awesome …');
		});

		it('Handles backticks: "all"', async () => {
			const fixture = await loadFixture({
				root: './fixtures/astro-markdown-plugins/',
				markdown: {
					...defaultMarkdownConfig,
					smartypants: { backticks: 'all', quotes: false },
				},
				outDir: './dist/astro-markdown-plugins-advanced-smartypants-configurations/',
			});
			await fixture.build();

			const html = await fixture.readFile('/with-backticks/index.html');
			const $ = cheerio.load(html);

			// With backticks: 'all', single and double backticks are transformed
			assert.ok($('p').html()!.includes('“Smarty”'));
		});
	});
});

function testRehype(html: string, headingId: string) {
	const $ = cheerio.load(html);
	assert.equal($(headingId).length, 1);
	assert.ok($(headingId).hasClass('title'));
}

function testRemark(html: string) {
	assert.ok(html.includes('Remark plugin applied!'));
}
