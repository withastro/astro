import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Importing raw/inlined CSS', () => {
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/css-inline/',
		});
	});
	describe('Build', () => {
		before(async () => {
			await fixture.build();
		});
		it('?inline is imported as a string', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			expect($('#inline').text()).to.contain('tomato');
			expect($('link[rel=stylesheet]')).to.have.lengthOf(1);
			expect($('style')).to.have.lengthOf(0);
		});

		it('?raw is imported as a string', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			expect($('#raw').text()).to.contain('plum');
			expect($('link[rel=stylesheet]')).to.have.lengthOf(1);
			expect($('style')).to.have.lengthOf(0);
		});
	});

	describe('Dev', () => {
		/** @type {import('./test-utils').DevServer} */
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it("?inline is imported as string and doesn't make css bundled ", async () => {
			const response = await fixture.fetch('/');
			const html = await response.text();
			const $ = cheerio.load(html);

			expect($('#inline').text()).to.contain('tomato');
			expect($('link[rel=stylesheet]')).to.have.lengthOf(0);
			expect($('style')).to.have.lengthOf(1);
		});

		it("?raw is imported as a string and doesn't make css bundled", async () => {
			const response = await fixture.fetch('/');
			const html = await response.text();
			const $ = cheerio.load(html);

			expect($('#raw').text()).to.contain('plum');
			expect($('link[rel=stylesheet]')).to.have.lengthOf(0);
			expect($('style')).to.have.lengthOf(1);
		});
	});
});
