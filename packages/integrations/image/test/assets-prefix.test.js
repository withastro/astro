import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

const assetsPrefixRegex = /^http:\/\/localhost:4321\/_astro\/.*/;

describe('Assets Prefix', function () {
	/** @type {import('../../../astro/test/test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/assets-prefix/' });
		await fixture.build();
	});

	it('images src has assets prefix', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const img = $('#social-jpg');
		expect(img.attr('src')).to.match(assetsPrefixRegex);
	});
});
