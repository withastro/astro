import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Astro Markdown without remark-rehype config', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-markdown-remarkRehype/',
		});
		await fixture.build();
	});
	it('Renders footnotes with default English labels', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		expect($('#footnote-label').text()).to.equal('Footnotes');
		expect($('.data-footnote-backref').first().attr('aria-label')).to.equal('Back to reference 1');
	});
});

describe('Astro Markdown with remark-rehype config', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-markdown-remarkRehype/',
			markdown: {
				remarkRehype: {
					footnoteLabel: 'Catatan kaki',
					footnoteBackLabel: 'Kembali ke konten',
				},
			},
		});
		await fixture.build();
	});
	it('Renders footnotes with values from the configuration', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		expect($('#footnote-label').text()).to.equal('Catatan kaki');
		expect($('.data-footnote-backref').first().attr('aria-label')).to.equal('Kembali ke konten');
	});
});
