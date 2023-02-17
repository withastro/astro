import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Head bubbling', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/head-bubbling/',
		});
		await fixture.build();
	});

	describe('index page', () => {
		/** @type {string} */
		let html;
		/** @type {ReturnType<typeof cheerio.load>} */
		let $;
		before(async () => {
			html = await fixture.readFile(`/index.html`);
			$ = cheerio.load(html);
		});

		it('Renders component head contents into the head', async () => {
			const $metas = $('head meta');

			expect($metas).to.have.a.lengthOf(2);
		});

		it('Body contents in the body', async () => {
			expect($('body article')).to.have.a.lengthOf(1);
		});
	});
});
