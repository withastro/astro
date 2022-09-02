import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('vite.build.cssCodeSplit: false', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/css-no-code-split/' });
		await fixture.build();
	});

	it('loads styles correctly', async () => {
		let html = await fixture.readFile('/index.html');
		let $ = cheerio.load(html);
		const cssHref = $('link[rel=stylesheet][href^=/assets/]').attr('href');
		expect(cssHref).to.match(/\/assets\/style\..*?\.css/);
	});
});
