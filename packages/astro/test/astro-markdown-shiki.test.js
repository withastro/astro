import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import markdownRemark from '@astrojs/markdown-remark';

describe('Astro Markdown Shiki', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			projectRoot: './fixtures/astro-markdown-shiki/',
			markdownOptions: {
				render: [
					markdownRemark,
					{
						syntaxHighlight: 'shiki',
						shikiTheme: 'github-light',
					},
				],
			},
			buildOptions: {
				sitemap: false,
			},
		});
		await fixture.build();
	});

	it('Can render markdown with shiki', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		// There should be no HTML from Prism
		expect($('.token')).to.have.lengthOf(0);

		expect($('pre')).to.have.lengthOf(1);
		expect($('pre').hasClass('astro-code')).to.equal(true);
		expect($('pre').attr().style).to.equal('background-color: #ffffff');
	});

	it('Can render Astro <Markdown> with shiki', async () => {
		const html = await fixture.readFile('/astro/index.html');
		const $ = cheerio.load(html);

		// There should be no HTML from Prism
		expect($('.token')).to.have.lengthOf(0);

		expect($('pre')).to.have.lengthOf(2);

		expect($('span.line')).to.have.lengthOf(2);
		expect($('span.line').get(0).children).to.have.lengthOf(1);
		expect($('span.line').get(1).children).to.have.lengthOf(5);
	});
});
