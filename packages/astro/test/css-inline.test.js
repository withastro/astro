import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Importing raw/inlined CSS', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/css-inline/',
		});
		await fixture.build();
	});

	it('?inline is imported as a string', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		expect($('#inline').text()).to.contain('tomato');
	});

	it('?raw is imported as a string', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		expect($('#raw').text()).to.contain('plum');
	});
});
