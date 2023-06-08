import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import addClasses from './fixtures/astro-markdown-plugins/add-classes.mjs';

const defaultMarkdownConfig = {
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

function remarkExamplePlugin() {
	return (tree) => {
		tree.children.push({
			type: 'paragraph',
			children: [{ type: 'text', value: 'Remark plugin applied!' }],
		});
	};
}

describe('Astro Markdown plugins', () => {
	describe('Default test plugins', () => {
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-markdown-plugins/',
				markdown: defaultMarkdownConfig,
			});
			await fixture.build();
		});

		it('Can render markdown with plugins', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			// test 1: Added a TOC
			expect($('.toc')).to.have.lengthOf(1);

			// test 2: Added .title to h1
			expect($('#hello-world').hasClass('title')).to.equal(true);
		});

		// Asserts Astro 1.0 behavior is removed. Test can be removed in Astro 3.0.
		it('Still applies default plugins when user plugins are provided', async () => {
			const gfmHtml = await fixture.readFile('/with-gfm/index.html');
			const $1 = cheerio.load(gfmHtml);
			expect($1('a[href="https://example.com"]')).to.have.lengthOf(1);

			const smartypantsHtml = await fixture.readFile('/with-smartypants/index.html');
			const $2 = cheerio.load(smartypantsHtml);
			expect($2('p').html()).to.equal('“Smartypants” is — awesome');

			testRemark(gfmHtml);
			testRehype(gfmHtml, '#github-flavored-markdown-test');
		});

		it(`Handles GFM when gfm = true`, async () => {
			const html = await fixture.readFile('/with-gfm/index.html');
			const $ = cheerio.load(html);

			// test 1: GFM autolink applied correctly
			expect($('a[href="https://example.com"]')).to.have.lengthOf(1);

			testRemark(html);
			testRehype(html, '#github-flavored-markdown-test');
		});

		it(`Handles SmartyPants when smartypants = true`, async () => {
			const html = await fixture.readFile('/with-smartypants/index.html');
			const $ = cheerio.load(html);

			// test 1: smartypants applied correctly
			expect($('p').html()).to.equal('“Smartypants” is — awesome');

			testRemark(html);
			testRehype(html, '#smartypants-test');
		});
	});

	it(`Handles GFM when gfm = false`, async () => {
		const fixture = await loadFixture({
			root: './fixtures/astro-markdown-plugins/',
			markdown: { ...defaultMarkdownConfig, gfm: false },
		});
		await fixture.build();

		const html = await fixture.readFile('/with-gfm/index.html');
		const $ = cheerio.load(html);

		expect($('a[href="https://example.com"]')).to.have.lengthOf(0);

		testRemark(html);
		testRehype(html, '#github-flavored-markdown-test');
	});

	it(`Handles SmartyPants when smartypants = false`, async () => {
		const fixture = await loadFixture({
			root: './fixtures/astro-markdown-plugins/',
			markdown: { ...defaultMarkdownConfig, smartypants: false },
		});
		await fixture.build();

		const html = await fixture.readFile('/with-smartypants/index.html');
		const $ = cheerio.load(html);

		expect($('p').html()).to.equal('"Smartypants" is -- awesome');

		testRemark(html);
		testRehype(html, '#smartypants-test');
	});
});

function testRehype(html, headingId) {
	const $ = cheerio.load(html);
	expect($(headingId)).to.have.lengthOf(1);
	expect($(headingId).hasClass('title')).to.equal(true);
}

function testRemark(html) {
	expect(html).to.include('Remark plugin applied!');
}
