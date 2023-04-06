import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('scopedStyleStrategy', () => {
	describe('default', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;
		let stylesheet;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/scoped-style-strategy/',
			});
			await fixture.build();

			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			const $link = $('link[rel=stylesheet]');
			const href = $link.attr('href');
			stylesheet = await fixture.readFile(href);
		});

		it('includes :where pseudo-selector', () => {
			expect(stylesheet).to.match(/:where/);
		});

		it('does not includes the class name directly in the selector', () => {
			expect(stylesheet).to.not.match(/h1\.astro/);
		});
	});

	describe('scopedStyleStrategy: "class"', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;
		let stylesheet;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/scoped-style-strategy/',
				scopedStyleStrategy: 'class'
			});
			await fixture.build();

			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			const $link = $('link[rel=stylesheet]');
			const href = $link.attr('href');
			stylesheet = await fixture.readFile(href);
		});

		it('does not include :where pseudo-selector', () => {
			expect(stylesheet).to.not.match(/:where/);
		});

		it('includes the class name directly in the selector', () => {
			expect(stylesheet).to.match(/h1\.astro/);
		});
	});
});
