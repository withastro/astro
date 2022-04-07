import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Remote CSS', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/remote-css/',
		});
		await fixture.build();
	});

	it('Includes all styles on the page', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		const relPath = $('link').attr('href');
		const css = await fixture.readFile(relPath);

		expect(css).to.match(/https:\/\/unpkg.com\/open-props/);
		expect(css).to.match(/body/);
	});
});
