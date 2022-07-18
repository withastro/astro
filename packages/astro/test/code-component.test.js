import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Code component', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/code-component/' });
		await fixture.build();
	});

	it('Debug component styles are not included in the page', async () => {
		let html = await fixture.readFile('/index.html');
		let $ = cheerio.load(html);
		expect($('link[rel=stylesheet]')).to.have.a.lengthOf(0, 'No styles should be built');
		expect($('style')).to.have.a.lengthOf(0);
	});

	it('is:raw attribute not serialized', async () => {
		let html = await fixture.readFile('/index.html');
		let $ = cheerio.load(html);
		expect($('pre').attr('is:raw')).to.equal(undefined);
	});
});
