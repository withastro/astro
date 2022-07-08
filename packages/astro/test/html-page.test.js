import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('HTML Page', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/html-page/',
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('works', async () => {
			const html = await fixture.readFile('/index.html');
			let $ = cheerio.load(html);
			expect($('h1')).to.have.a.lengthOf(1, 'renders h1');
			expect($('h1').text().trim()).to.have.equal('Hello page!');
		});
	});

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('works', async () => {
			const res = await fixture.fetch('/');

			expect(res.status).to.equal(200);

			const html = await res.text();
			let $ = cheerio.load(html);
			expect($('h1')).to.have.a.lengthOf(1, 'renders h1');
			expect($('h1').text().trim()).to.have.equal('Hello page!');
		});
	});
});
