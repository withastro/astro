import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Aliases with tsconfig.json', () => {
	let fixture;

	/**
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

	/**
	 * @param {string} href
	 * @returns {Promise<{ href: string; css: string; }>}
	 */
	async function getLinkContent(href, f = fixture) {
		const css = await f.readFile(href);
		return { href, css };
	}

	before(async () => {
		fixture = await loadFixture({
			// test suite was authored when inlineStylesheets defaulted to never
			build: { inlineStylesheets: 'never' },
			root: './fixtures/alias-tsconfig/',
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

		it('can load client components', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerio.load(html);

			// Should render aliased element
			expect($('#client').text()).to.equal('test');

			const scripts = $('script').toArray();
			expect(scripts.length).to.be.greaterThan(0);
		});

		it('can load via baseUrl', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerio.load(html);

			expect($('#foo').text()).to.equal('foo');
			expect($('#constants-foo').text()).to.equal('foo');
			expect($('#constants-index').text()).to.equal('index');
		});

		it('can load namespace packages with @* paths', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerio.load(html);

			expect($('#namespace').text()).to.equal('namespace');
		});

		it('works in css @import', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			// imported css should be bundled
			expect(html).to.include('#style-red');
			expect(html).to.include('#style-blue');
		});

		it('works in components', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerio.load(html);

			expect($('#alias').text()).to.equal('foo');
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('can load client components', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			// Should render aliased element
			expect($('#client').text()).to.equal('test');

			const scripts = $('script').toArray();
			expect(scripts.length).to.be.greaterThan(0);
		});

		it('can load via baseUrl', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			expect($('#foo').text()).to.equal('foo');
			expect($('#constants-foo').text()).to.equal('foo');
			expect($('#constants-index').text()).to.equal('index');
		});

		it('can load namespace packages with @* paths', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			expect($('#namespace').text()).to.equal('namespace');
		});

		it('works in css @import', async () => {
			const html = await fixture.readFile('/index.html');
			const content = await Promise.all(getLinks(html).map((href) => getLinkContent(href)));
			const [{ css }] = content;
			// imported css should be bundled
			expect(css).to.include('#style-red');
			expect(css).to.include('#style-blue');
		});

		it('works in components', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			expect($('#alias').text()).to.equal('foo');
		});
	});
});
