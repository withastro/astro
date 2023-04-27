import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('@fontsource/* packages', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: new URL('./fixtures/fontsource-package/', import.meta.url) });
		await fixture.build();
	});

	it('can be imported in frontmatter', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const assetPath = $('link').attr('href');
		const css = await fixture.readFile(assetPath);
		expect(css).to.contain('Montserrat');
	});
});
