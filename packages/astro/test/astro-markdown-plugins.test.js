import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import markdownRemark from '@astrojs/markdown-remark';

describe('Astro Markdown plugins', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			projectRoot: './fixtures/astro-markdown-plugins/',
			renderers: ['@astrojs/renderer-preact'],
			markdownOptions: {
				render: [
					markdownRemark,
					{
						remarkPlugins: ['remark-code-titles', ['rehype-autolink-headings', { behavior: 'prepend' }]],
						rehypePlugins: [
							[import('rehype-toc'), { headings: ['h2', 'h3'] }],
							[import('../../../examples/with-markdown-plugins/add-classes.mjs'), { 'h1,h2,h3': 'title' }],
							'rehype-slug',
						],
					},
				],
			},
			buildOptions: {
				sitemap: false,
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
		expect($('#hello-world').hasClass('title')).to.equal(true);
	});

	it('Can render Astro <Markdown> with plugins', async () => {
		const html = await fixture.readFile('/astro/index.html');
		const $ = cheerio.load(html);

		// test 1: Added a TOC
		expect($('.toc')).to.have.lengthOf(1);

		// teste 2: Added .title to h1
		expect($('#hello-world').hasClass('title')).to.equal(true);
	});
});
