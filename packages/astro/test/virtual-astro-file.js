import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Loading virtual Astro files', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/virtual-astro-file/' });
		await fixture.build();
	});

	it('works', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		expect($('#something')).to.have.a.lengthOf(1);
		expect($('#works').text()).to.equal('true');
	});
});
