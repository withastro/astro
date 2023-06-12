import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Loading virtual Astro files', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/virtual-astro-file/' });
		await fixture.build();
	});

	it('renders the component', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		expect($('#something')).to.have.a.lengthOf(1);
		expect($('#works').text()).to.equal('true');
	});

	it('builds component CSS', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const href = $('link').attr('href');
		const css = await fixture.readFile(href);
		expect(css).to.match(/green/, 'css bundled from virtual astro module');
	});
});
