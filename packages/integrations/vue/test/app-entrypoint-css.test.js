import { loadFixture } from './test-utils.js';
import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';

describe('App Entrypoint CSS', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/app-entrypoint-css/',
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('injects styles referenced in appEntrypoint', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerioLoad(html);

			// test 1: basic component renders
			expect($('#foo > #bar').text()).to.eq('works');

			// test 2: injects the global style on the page
			expect($('style').first().text().trim()).to.eq(':root{background-color:red}');
		});

		it('does not inject styles to pages without a Vue component', async () => {
			const html = await fixture.readFile('/unrelated/index.html');
			const $ = cheerioLoad(html);

			expect($('style').length).to.eq(0);
			expect($('link[rel="stylesheet"]').length).to.eq(0);
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

		it('loads during SSR', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerioLoad(html);

			// test 1: basic component renders
			expect($('#foo > #bar').text()).to.eq('works');
			// test 2: injects the global style on the page
			expect($('style').first().text().replace(/\s+/g, '')).to.eq(':root{background-color:red;}');
		});

		it('does not inject styles to pages without a Vue component', async () => {
			const html = await fixture.fetch('/unrelated').then((res) => res.text());
			const $ = cheerioLoad(html);

			expect($('style').length).to.eq(0);
			expect($('link[rel="stylesheet"]').length).to.eq(0);
		});
	});
});
