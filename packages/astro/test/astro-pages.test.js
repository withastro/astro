import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture, isWindows } from './test-utils.js';

describe('Pages', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/astro pages/' });
		await fixture.build();
	});

	describe('Build', () => {
		before(async () => {
			await fixture.build();
		});

		it('Can find page with "index" at the end file name', async () => {
			const html = await fixture.readFile('/posts/name-with-index/index.html');
			const $ = cheerio.load(html);

			expect($('h1').text()).to.equal('Name with index');
		});

		it('Can find page with quotes in file name', async () => {
			const html = await fixture.readFile("/quotes'-work-too/index.html");
			const $ = cheerio.load(html);

			expect($('h1').text()).to.equal('Quotes work too');
		});
	});

	if (isWindows) return;

	describe('Development', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Is able to load md pages', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerio.load(html);

			expect($('#testing').length).to.be.greaterThan(0);
		});

		it('should have Vite client in dev', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			expect(html).to.include('/@vite/client', 'Markdown page does not have Vite client for HMR');
		});
	});
});
