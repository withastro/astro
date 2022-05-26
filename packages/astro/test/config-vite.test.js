import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Vite Config', async () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/config-vite/' });
		await fixture.build();
	});

	it('Allows overriding bundle naming options in the build', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		expect($('link').attr('href')).to.match(/\/assets\/testing-[a-z0-9]+\.css/)
	});
});
