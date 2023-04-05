import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Projects with a space in the folder name', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/space in folder name/app/',
		});
	});

	describe('dev', () => {
		/** @type {import('./test-utils').Fixture} */
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Work with hoisted scripts', async () => {
			const html = await fixture.fetch('/').then((r) => r.text());
			const $ = cheerio.load(html);

			expect($('script[src*="/src/pages/index.astro"]')).to.have.a.lengthOf(1);
		});
	});
});
