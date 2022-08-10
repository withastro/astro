import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Preact compat component', () => {
	describe('Development', () => {
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/preact-compat-component/',
			});
			await fixture.startDevServer();
		});

		it('Can load Counter', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerio.load(html);

			expect($('#counter-text').text()).to.be.eq('0');
		});
	});

	describe('Build', () => {
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/preact-compat-component/',
			});
			await fixture.build();
		});

		it('Can load Counter', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			expect($('#counter-text').text()).to.be.eq('0');
		});
	});
});
