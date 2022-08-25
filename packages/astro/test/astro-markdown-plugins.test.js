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

	for (const extendDefaultPlugins of [true, false]) {
		it(`Handles default plugins when extendDefaultPlugins = ${extendDefaultPlugins}`, async () => {
			const fixture = await buildFixture({
				markdown: {
					remarkPlugins: [remarkExamplePlugin],
					rehypePlugins: [[addClasses, { 'h1,h2,h3': 'title' }]],
					extendDefaultPlugins,
				},
			});
			const html = await fixture.readFile('/with-gfm/index.html');
			const $ = cheerio.load(html);

			// test 1: GFM autolink applied correctly
			if (extendDefaultPlugins === true) {
				expect($('a[href="https://example.com"]')).to.have.lengthOf(1);
			} else {
				expect($('a[href="https://example.com"]')).to.have.lengthOf(0);
			}

			// test 2: (sanity check) remark plugins still applied
			expect(html).to.include('Remark plugin applied!');

			// test 3: (sanity check) rehype plugins still applied
			expect($('#github-flavored-markdown-test')).to.have.lengthOf(1);
			expect($('#github-flavored-markdown-test').hasClass('title')).to.equal(true);
		});
	}
});
