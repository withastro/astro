import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Integration addPageExtension', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/integration-add-page-extension/' });
		await fixture.build();
	});

	it('supports .mjs files', async () => {
		const html = await fixture.readFile('/test/index.html');
		const $ = cheerio.load(html);
		expect($('h1').text()).to.equal('Hello world!');
	});
});
