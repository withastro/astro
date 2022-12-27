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
	it('Still applies GFM when user plugins are provided', async () => {
		const fixture = await buildFixture({
			markdown: {
				remarkPlugins: [remarkExamplePlugin],
				rehypePlugins: [[addClasses, { 'h1,h2,h3': 'title' }]],
			},
		});
		const html = await fixture.readFile('/with-gfm/index.html');
		const $ = cheerio.load(html);

		// test 1: GFM autolink applied correctly
		expect($('a[href="https://example.com"]')).to.have.lengthOf(1);

		// test 2: remark plugins still applied
		expect(html).to.include('Remark plugin applied!');

		// test 3: rehype plugins still applied
		expect($('#github-flavored-markdown-test')).to.have.lengthOf(1);
		expect($('#github-flavored-markdown-test').hasClass('title')).to.equal(true);
	});

	for (const githubFlavoredMarkdown of [true, false]) {
		it(`Handles GFM when githubFlavoredMarkdown = ${githubFlavoredMarkdown}`, async () => {
			const fixture = await buildFixture({
				markdown: {
					remarkPlugins: [remarkExamplePlugin],
					rehypePlugins: [[addClasses, { 'h1,h2,h3': 'title' }]],
					githubFlavoredMarkdown,
				},
			});
			const html = await fixture.readFile('/with-gfm/index.html');
			const $ = cheerio.load(html);

			// test 1: GFM autolink applied correctly
			if (githubFlavoredMarkdown === true) {
				expect($('a[href="https://example.com"]')).to.have.lengthOf(1);
			} else {
				expect($('a[href="https://example.com"]')).to.have.lengthOf(0);
			}

			// test 2: remark plugins still applied
			expect(html).to.include('Remark plugin applied!');

			// test 3: rehype plugins still applied
			expect($('#github-flavored-markdown-test')).to.have.lengthOf(1);
			expect($('#github-flavored-markdown-test').hasClass('title')).to.equal(true);
		});
	}
});
