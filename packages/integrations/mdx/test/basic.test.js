import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('basic - dev', () => {
	/** @type {import('../../../astro/test/test-utils.js').Fixture} */
	let fixture;
	/** @type {import('../../../astro/test/test-utils.js').DevServer} */
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/basic/', import.meta.url),
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	describe('build css from the component', () => {
		it('including css and js from the component', async () => {
			let res = await fixture.fetch(`/astro-content-css/`);
			expect(res.status).to.equal(200);
			const html = await res.text();
			const $ = cheerio.load(html);
			expect($.html()).to.include('CornflowerBlue');
			expect($('script[src$=".js"]').attr('src')).to.include('astro');
		});
	});
});

describe('basic - build', () => {
	/** @type {import('../../../astro/test/test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/basic/', import.meta.url),
		});
		await fixture.build();
	});

	describe('build css from the component', () => {
		it('including css and js from the component', async () => {
			const html = await fixture.readFile('/astro-content-css/index.html');
			const $ = cheerio.load(html);
			expect($('link[href$=".css"]').attr('href')).to.match(/^\/_astro\//);
			expect($('script[src$=".js"]').attr('src')).to.match(/^\/_astro\//);
		});
	});
});
