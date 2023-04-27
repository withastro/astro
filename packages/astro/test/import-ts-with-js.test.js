import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Using .js extension on .ts file', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: new URL('./fixtures/import-ts-with-js/', import.meta.url) });
		await fixture.build();
	});

	it('works in .astro files', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		expect($('h1').text()).to.equal('bar');
	});
});
