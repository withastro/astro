import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Markdown tests', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/markdown/',
		});
	});

	describe('Build', () => {
		before(async () => {
			await fixture.build();
		});

		it('Can load a markdown page with the `.markdown` extension', async () => {
			const html = await fixture.readFile('/dot-markdown-page/index.html');
			const $ = cheerio.load(html);
			expect($('h1').html()).to.equal('Page with alternative .markdown extension');
			expect($('p').html()).to.equal('Hope this loads fine 🤞');
		});

		it('Can load a markdown page with the `.mdwn` extension', async () => {
			const html = await fixture.readFile('/dot-mdwn-page/index.html');
			const $ = cheerio.load(html);
			expect($('h1').html()).to.equal('Page with alternative .mdwn extension');
			expect($('p').html()).to.equal('Hope this loads fine 🤞');
		});

		it('Can load a markdown page with the `.mkdn` extension', async () => {
			const html = await fixture.readFile('/dot-mkdn-page/index.html');
			const $ = cheerio.load(html);
			expect($('h1').html()).to.equal('Page with alternative .mkdn extension');
			expect($('p').html()).to.equal('Hope this loads fine 🤞');
		});

		it('Can load a markdown page with the `.mdown` extension', async () => {
			const html = await fixture.readFile('/dot-mdown-page/index.html');
			const $ = cheerio.load(html);
			expect($('h1').html()).to.equal('Page with alternative .mdown extension');
			expect($('p').html()).to.equal('Hope this loads fine 🤞');
		});

		it('Can load a markdown page with the `.mkd` extension', async () => {
			const html = await fixture.readFile('/dot-mkd-page/index.html');
			const $ = cheerio.load(html);
			expect($('h1').html()).to.equal('Page with alternative .mkd extension');
			expect($('p').html()).to.equal('Hope this loads fine 🤞');
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

		it('Does not unescape entities', async () => {
			const html = await fixture.readFile('/entities/index.html');
			expect(html).to.match(new RegExp('&#x3C;i>This should NOT be italic&#x3C;/i>'));
		});
	});
});
