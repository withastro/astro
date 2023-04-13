import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('CSS ordering - import order', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/css-order-import/',
		});
	});

	/**
	 *
	 * @param {string} html
	 * @returns {string[]}
	 */
	function getLinks(html) {
		let $ = cheerio.load(html);
		let out = [];
		$('link[rel=stylesheet]').each((i, el) => {
			out.push($(el).attr('href'));
		});
		return out;
	}

	function getStyles(html) {
		let $ = cheerio.load(html);
		let out = [];
		$('style').each((i, el) => {
			out.push($(el).text());
		});
		return out;
	}

	/**
	 *
	 * @param {string} href
	 * @returns {Promise<{ href: string; css: string; }>}
	 */
	async function getLinkContent(href, f = fixture) {
		const css = await f.readFile(href);
		return { href, css };
	}

	describe('Development', () => {
		/** @type {import('./test-utils').DevServer} */
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Page level CSS is defined lower in the page', async () => {
			let res = await fixture.fetch('/');
			let html = await res.text();
			let [style1, style2] = getStyles(html);

			expect(style1).to.include('green');
			expect(style2).to.include('salmon');
		});

		it('import order is depth-first', async () => {
			let res = await fixture.fetch('/component/');
			let html = await res.text();
			let [style1, style2, style3] = getStyles(html);

			expect(style1).to.include('burlywood');
			expect(style2).to.include('aliceblue');
			expect(style3).to.include('whitesmoke');
		});
	});

	describe('Production', () => {
		before(async () => {
			await fixture.build();
		});

		it('Page level CSS is defined lower in the page', async () => {
			let html = await fixture.readFile('/index.html');

			const content = await Promise.all(getLinks(html).map((href) => getLinkContent(href)));

			const [{ css }] = content;
			let idx1 = css.indexOf('salmon');
			let idx2 = css.indexOf('green');

			expect(idx1).to.be.greaterThan(idx2, 'Page level CSS should be placed after imported CSS');
		});

		it('import order is depth-first', async () => {
			let html = await fixture.readFile('/component/index.html');

			const content = await Promise.all(getLinks(html).map((href) => getLinkContent(href)));

			const [{ css }] = content;
			let idx1 = css.indexOf('whitesmoke');
			let idx2 = css.indexOf('aliceblue');
			let idx3 = css.indexOf('burlywood');

			expect(idx1).to.be.greaterThan(idx2);
			expect(idx2).to.be.greaterThan(idx3);
		});

		it('correctly chunks css import from framework components', async () => {
			let html = await fixture.readFile('/index.html');

			const content = await Promise.all(getLinks(html).map((href) => getLinkContent(href)));
			const [, { css }] = content;
			expect(css).to.not.include(
				'.client-1{background:red!important}',
				'CSS from Client2.jsx leaked into index.astro when chunking'
			);
		});

		it('dedupe css between astro and framework components', async () => {
			let html = await fixture.readFile('/dedupe/index.html');

			const content = await Promise.all(getLinks(html).map((href) => getLinkContent(href)));
			const css = content.map((c) => c.css).join('');
			expect(css.match(/\.astro-jsx/)?.length).to.eq(1, '.astro-jsx class is duplicated');
		});
	});

	describe('Dynamic import', () => {
		// eslint-disable-next-line @typescript-eslint/no-shadow
		let fixture;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/css-order-dynamic-import/',
			});
			await fixture.build();
		});

		it('dynamic imports taken into account', async () => {
			let html = await fixture.readFile('/one/index.html');
			const content = await Promise.all(
				getLinks(html).map((href) => getLinkContent(href, fixture))
			);
			let [link1, link2] = content;
			expect(link1.css).to.contain('aliceblue');
			expect(link2.css).to.contain('yellow');
		});
	});
});
