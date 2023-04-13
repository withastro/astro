import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('srcDir', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/root-srcdir-css/',
		});
		await fixture.build();
	});

	it('when the srcDir is "." which parser style in index.astro', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		const relPath = $('link').attr('href');
		const css = await fixture.readFile(relPath);
		expect(css).to.match(/body{color:green}/);
	});
});
