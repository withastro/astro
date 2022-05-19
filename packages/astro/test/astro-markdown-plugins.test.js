import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import addClasses from './fixtures/astro-markdown-plugins/add-classes.mjs';
import updateFrontmatter from './fixtures/astro-markdown-plugins/update-frontmatter.mjs';

describe('Astro Markdown plugins', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-markdown-plugins/',
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
				frontmatterPlugins: [updateFrontmatter],
			},
		});
		await fixture.build();
	});

	it('Can render markdown with plugins', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		// test 1: Added a TOC
		expect($('.toc')).to.have.lengthOf(1);

		// teste 2: Added .title to h1
		expect($('#hello-world-from-page').hasClass('title')).to.equal(true);
	});

	it('Can render Astro <Markdown> with plugins', async () => {
		const html = await fixture.readFile('/astro/index.html');
		const $ = cheerio.load(html);

		// test 1: Added a TOC
		expect($('.toc')).to.have.lengthOf(1);

		// teste 2: Added .title to h1
		expect($('#hello-world-from-component').hasClass('title')).to.equal(true);
	});

	it('Can update Markdown frontmatter from config', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		// test 1: Switched layout
		expect($('.container-alt')).to.have.lengthOf(1);
		expect($('.container')).to.have.lengthOf(0);
	});
});
