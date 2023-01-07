import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import addClasses from './fixtures/astro-markdown-plugins/add-classes.mjs';

async function buildFixture(config) {
	const fixture = await loadFixture({
		root: './fixtures/astro-markdown-plugins/',
		...config,
	});
	await fixture.build();
	return fixture;
}

function remarkExamplePlugin() {
	return (tree) => {
		tree.children.push({
			type: 'paragraph',
			children: [{ type: 'text', value: 'Remark plugin applied!' }],
		});
	};
}

describe('Astro Markdown plugins', () => {
	it('Can render markdown with plugins', async () => {
		const fixture = await buildFixture({
			markdown: {
				remarkPlugins: [
					'remark-code-titles',
					['rehype-autolink-headings', { behavior: 'prepend' }],
				],
				rehypePlugins: [
					'rehype-slug',
					['rehype-toc', { headings: ['h2', 'h3'] }],
					[addClasses, { 'h1,h2,h3': 'title' }],
				],
			},
		});
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		// test 1: Added a TOC
		expect($('.toc')).to.have.lengthOf(1);

		// test 2: Added .title to h1
		expect($('#hello-world').hasClass('title')).to.equal(true);
	});

	// Asserts Astro 1.0 behavior is removed. Test can be removed in Astro 3.0.
	it('Still applies default plugins when user plugins are provided', async () => {
		const fixture = await buildFixture({
			markdown: {
				remarkPlugins: [remarkExamplePlugin],
				rehypePlugins: [[addClasses, { 'h1,h2,h3': 'title' }]],
			},
		});
		const gfmHtml = await fixture.readFile('/with-gfm/index.html');
		const $1 = cheerio.load(gfmHtml);
		expect($1('a[href="https://example.com"]')).to.have.lengthOf(1);

		const smartypantsHtml = await fixture.readFile('/with-smartypants/index.html');
		const $2 = cheerio.load(smartypantsHtml);
		expect($2('p').html()).to.equal('“Smartypants” is — awesome');

		testRemark(gfmHtml);
		testRehype(gfmHtml, '#github-flavored-markdown-test');
	});

	for (const gfm of [true, false]) {
		it(`Handles GFM when gfm = ${gfm}`, async () => {
			const fixture = await buildFixture({
				markdown: {
					remarkPlugins: [remarkExamplePlugin],
					rehypePlugins: [[addClasses, { 'h1,h2,h3': 'title' }]],
					gfm,
				},
			});
			const html = await fixture.readFile('/with-gfm/index.html');
			const $ = cheerio.load(html);

			// test 1: GFM autolink applied correctly
			if (gfm === true) {
				expect($('a[href="https://example.com"]')).to.have.lengthOf(1);
			} else {
				expect($('a[href="https://example.com"]')).to.have.lengthOf(0);
			}

			testRemark(html);
			testRehype(html, '#github-flavored-markdown-test');
		});
	}

	for (const smartypants of [true, false]) {
		it(`Handles SmartyPants when smartypants = ${smartypants}`, async () => {
			const fixture = await buildFixture({
				markdown: {
					remarkPlugins: [remarkExamplePlugin],
					rehypePlugins: [[addClasses, { 'h1,h2,h3': 'title' }]],
					smartypants,
				},
			});
			const html = await fixture.readFile('/with-smartypants/index.html');
			const $ = cheerio.load(html);

			// test 1: GFM autolink applied correctly
			if (smartypants === true) {
				expect($('p').html()).to.equal('“Smartypants” is — awesome');
			} else {
				expect($('p').html()).to.equal('"Smartypants" is -- awesome');
			}

			testRemark(html);
			testRehype(html, '#smartypants-test');
		});
	}
});

function testRehype(html, headingId) {
	const $ = cheerio.load(html);
	expect($(headingId)).to.have.lengthOf(1);
	expect($(headingId).hasClass('title')).to.equal(true);
}

function testRemark(html) {
	expect(html).to.include('Remark plugin applied!');
}
