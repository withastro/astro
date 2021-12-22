import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('nested layouts', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ projectRoot: './fixtures/astro-css-bundling-nested-layouts/' });
		await fixture.build();
	});

	it('page-1 has all CSS', async () => {
		const html = await fixture.readFile('/page-1/index.html');
		const $ = cheerio.load(html);

		const stylesheets = $('link[rel=stylesheet]')
			.toArray()
			.map((el) => el.attribs.href);

		// page-one.[hash].css exists
		expect(stylesheets.some((href) => /page-one\.\w+\.css/.test(href))).to.be.true;
	});

	it('page-2 has all CSS', async () => {
		const html = await fixture.readFile('/page-2/index.html');
		const $ = cheerio.load(html);

		const stylesheets = $('link[rel=stylesheet]')
			.toArray()
			.map((el) => el.attribs.href);

		// page-one.[hash].css exists
		expect(stylesheets.some((href) => /page-one\.\w+\.css/.test(href))).to.be.true;
		// page-2.[hash].css exists
		expect(stylesheets.some((href) => /page-2\.\w+\.css/.test(href))).to.be.true;
	});
});
