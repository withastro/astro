import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('CSS using fonts', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/css-assets/' });
		await fixture.build();
	});

	it('__VITE_ASSET__ placeholder removed', async () => {
		const html = await fixture.readFile('/one/index.html');
		const $ = cheerioLoad(html);
		const href = $('link[rel=stylesheet]').attr('href');
		const css = await fixture.readFile(href);
		console.log(css)
		expect(css).to.not.match(/__VITE_ASSET__/);
		//__VITE_ASSET__
	});

});
