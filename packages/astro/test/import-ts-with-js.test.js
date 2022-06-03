import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Using .js extension on .ts file', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/import-ts-with-js/' });
		await fixture.build();
	});

	it('works in .astro files', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		expect($('h1').text()).to.equal('bar');
	});

	it('works in .md files', async () => {
		const html = await fixture.readFile('/post/index.html');
		const $ = cheerio.load(html);
		expect($('h2').text()).to.equal('bar');
	});
});
