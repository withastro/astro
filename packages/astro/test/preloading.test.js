import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import * as cheerio from 'cheerio';

describe('preloading', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/preloading/',
		});
		await fixture.build()
	});

	it('rendered page includes a link rel=modulepreload', async () => {
		const html = await fixture.readFile('/module1/index.html');
		const $ = cheerio.load(html);
		const link = $('link')[0];
		expect(link.attribs).to.deep.include({ rel: 'modulepreload' });
		expect(link.attribs.href).to.include('to-be-preloaded');
	});
});
