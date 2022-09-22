import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Non-ASCII Path Test', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/non-ascii-path/测试/' });
		await fixture.build();
	});

	describe('build', () => {
		it('Can load page', async () => {
			const html = await fixture.readFile(`/index.html`);
			const $ = cheerio.load(html);

			expect($('h1').text()).to.equal('测试 OK');
		});
	});
});
