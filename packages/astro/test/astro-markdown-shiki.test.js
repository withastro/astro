import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Astro Markdown Shiki', () => {
	describe('Render shiki', () => {
		let fixture;

		before(async () => {
			fixture = await loadFixture({ root: './fixtures/astro-markdown-shiki/normal/' });
			await fixture.build();
		});

		it('Can render markdown with shiki', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			// There should be no HTML from Prism
			expect($('.token')).to.have.lengthOf(0);

			expect($('pre')).to.have.lengthOf(2);
			expect($('pre').hasClass('astro-code')).to.equal(true);
			expect($('pre').attr().style).to.equal('background-color: #24292e; overflow-x: auto;');
		});

		it('Can render diff syntax with "user-select: none"', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			const diffBlockHtml = $('pre').last().html();
			expect(diffBlockHtml).to.contain(`<span style="user-select: none;">+</span>`);
			expect(diffBlockHtml).to.contain(`<span style="user-select: none;">-</span>`);
		});
	});

	describe('Themes', () => {
		describe('Integrated theme', async () => {
			let fixture;

			before(async () => {
				fixture = await loadFixture({ root: './fixtures/astro-markdown-shiki/themes-integrated/' });
				await fixture.build();
			});

			it('Markdown file', async () => {
				const html = await fixture.readFile('/index.html');
				const $ = cheerio.load(html);

				expect($('pre')).to.have.lengthOf(1);
				expect($('pre').hasClass('astro-code')).to.equal(true);
				expect($('pre').attr().style).to.equal('background-color: #fff; overflow-x: auto;');
			});
		});

		describe('Custom theme', async () => {
			let fixture;

			before(async () => {
				fixture = await loadFixture({ root: './fixtures/astro-markdown-shiki/themes-custom/' });
				await fixture.build();
			});

			it('Markdown file', async () => {
				const html = await fixture.readFile('/index.html');
				const $ = cheerio.load(html);

				expect($('pre')).to.have.lengthOf(1);
				expect($('pre').hasClass('astro-code')).to.equal(true);
				expect($('pre').attr().style).to.equal('background-color: #FDFDFE; overflow-x: auto;');
			});
		});
	});

	describe('Custom langs', () => {
		let fixture;

		before(async () => {
			fixture = await loadFixture({ root: './fixtures/astro-markdown-shiki/langs/' });
			await fixture.build();
		});

		it('Markdown file', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			const segments = $('.line').get(6).children;
			expect(segments).to.have.lengthOf(3);
			expect(segments[0].attribs.style).to.be.equal('color: #E1E4E8');
			expect(segments[1].attribs.style).to.be.equal('color: #79B8FF');
			expect(segments[2].attribs.style).to.be.equal('color: #E1E4E8');

			const unknownLang = $('.line').last().html();
			expect(unknownLang).to.be.equal(
				'<span style="color: #e1e4e8">This language does not exist</span>'
			);
		});
	});

	describe('Wrap', () => {
		describe('wrap = true', () => {
			const style =
				'background-color: #24292e; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;';
			let fixture;

			before(async () => {
				fixture = await loadFixture({ root: './fixtures/astro-markdown-shiki/wrap-true/' });
				await fixture.build();
			});

			it('Markdown file', async () => {
				const html = await fixture.readFile('/index.html');
				const $ = cheerio.load(html);

				expect($('pre')).to.have.lengthOf(1);
				expect($('pre').attr('style')).to.equal(style);
			});
		});
	});

	describe('wrap = false', () => {
		const style = 'background-color: #24292e; overflow-x: auto;';
		let fixture;

		before(async () => {
			fixture = await loadFixture({ root: './fixtures/astro-markdown-shiki/wrap-false/' });
			await fixture.build();
		});

		it('Markdown file', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			expect($('pre')).to.have.lengthOf(1);
			expect($('pre').attr('style')).to.equal(style);
		});
	});

	describe('wrap = null', () => {
		const style = 'background-color: #24292e';
		let fixture;

		before(async () => {
			fixture = await loadFixture({ root: './fixtures/astro-markdown-shiki/wrap-null/' });
			await fixture.build();
		});

		it('Markdown file', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			expect($('pre')).to.have.lengthOf(1);
			expect($('pre').attr('style')).to.equal(style);
		});
	});
});
