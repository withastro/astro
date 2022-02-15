import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Markdown tests', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			projectRoot: './fixtures/markdown/',
			buildOptions: {
				sitemap: false,
			},
			renderers: ['@astrojs/renderer-preact'],
		});
		await fixture.build();
	});

	it('Can load a simple markdown page with Astro', async () => {
		const html = await fixture.readFile('/post/index.html');
		const $ = cheerio.load(html);

		expect($('p').first().text()).to.equal('Hello world!');
		expect($('#first').text()).to.equal('Some content');
		expect($('#interesting-topic').text()).to.equal('Interesting Topic');
	});

	it('Can load a realworld markdown page with Astro', async () => {
		const html = await fixture.readFile('/realworld/index.html');
		const $ = cheerio.load(html);

		expect($('pre')).to.have.lengthOf(7);
	});
});
