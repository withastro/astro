import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('getStaticPaths with trailingSlash: ignore', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/get-static-paths-pages/',
			site: 'https://mysite.dev/',
		});
		await fixture.build();
	});

	it('includes index page', async () => {
		let html = await fixture.readFile('/index.html');
		let $ = cheerio.load(html);
		expect($('h1').text()).to.equal('Page 1');
	});

	it('includes paginated page', async () => {
		let html = await fixture.readFile('/2/index.html');
		let $ = cheerio.load(html);
		expect($('h1').text()).to.equal('Page 2');
	});
});
