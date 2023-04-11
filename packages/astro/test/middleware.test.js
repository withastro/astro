import { loadFixture } from './test-utils.js';
import { expect } from 'chai';
import * as cheerio from 'cheerio';

describe('Middleware API', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/dev-middleware/',
		});
	});

	describe('in DEV mode', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('should render locals data', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerio.load(html);
			expect($('p').html()).to.equal('bar');
		});

		it('should change locals data based on URL', async () => {
			let html = await fixture.fetch('/').then((res) => res.text());
			let $ = cheerio.load(html);
			expect($('p').html()).to.equal('bar');

			html = await fixture.fetch('/lorem').then((res) => res.text());
			$ = cheerio.load(html);
			expect($('p').html()).to.equal('ipsum');
		});

		it('should call a second middleware', async () => {
			let html = await fixture.fetch('/second').then((res) => res.text());
			let $ = cheerio.load(html);
			expect($('p').html()).to.equal('second');
		});
	});
});
