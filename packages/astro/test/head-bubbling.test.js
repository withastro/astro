import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Astro basics', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/head-bubbling/',
		});
		await fixture.build();
	});

	describe('build', () => {
		it('Renders component head contents into the head', async () => {
			const html = await fixture.readFile(`/index.html`);
			console.log(html);
			//const $ = cheerio.load(html);

			//expect($('h1').text()).to.equal('Hello world!');
		});
	});
});
