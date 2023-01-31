import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Astro generator', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-generator/',
		});
		await fixture.build();
	});

	describe('build', () => {
		it('Defines Astro.generator', async () => {
			const html = await fixture.readFile(`/index.html`);
			const $ = cheerio.load(html);

			expect($('meta[name="generator"]').attr('content')).to.match(/^Astro v/);
		});
	});
});
