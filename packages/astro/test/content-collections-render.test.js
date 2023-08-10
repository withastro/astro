import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture, isWindows } from './test-utils.js';
import testAdapter from './test-adapter.js';

const describe = isWindows ? global.describe.skip : global.describe;

describe('Content Collections - render()', () => {
	describe('Build - SSG', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/content/',
			});
			await fixture.build();
		});

		it('Includes CSS for rendered entry', async () => {
			const html = await fixture.readFile('/launch-week/index.html');
			const $ = cheerio.load(html);

			// Renders content
			expect($('ul li')).to.have.a.lengthOf(3);

			// Includes styles
			expect($('link[rel=stylesheet]')).to.have.a.lengthOf(1);
		});

		it('Excludes CSS for non-rendered entries', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			// Excludes styles
			expect($('link[rel=stylesheet]')).to.have.a.lengthOf(0);
		});

		it('De-duplicates CSS used both in layout and directly in target page', async () => {
			const html = await fixture.readFile('/with-layout-prop/index.html');
			const $ = cheerio.load(html);

			const set = new Set();

			$('link[rel=stylesheet]').each((_, linkEl) => {
				const href = linkEl.attribs.href;
				expect(set).to.not.contain(href);
				set.add(href);
			});

			$('style').each((_, styleEl) => {
				const textContent = styleEl.children[0].data;
				expect(set).to.not.contain(textContent);
				set.add(textContent);
			});
		});

		it('Includes component scripts for rendered entry', async () => {
			const html = await fixture.readFile('/launch-week-component-scripts/index.html');
			const $ = cheerio.load(html);

			const allScripts = $('head > script[type="module"]');
			expect(allScripts).to.have.length;

			// Includes hoisted script
			expect(
				[...allScripts].find((script) => $(script).attr('src')?.includes('WithScripts')),
				'`WithScripts.astro` hoisted script missing from head.'
			).to.not.be.undefined;

			// Includes inline script
			expect($('script[data-is-inline]')).to.have.a.lengthOf(1);
		});

		it('Excludes component scripts for non-rendered entries', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			const allScripts = $('head > script[type="module"]');

			// Excludes hoisted script
			expect(
				[...allScripts].find((script) =>
					$(script).text().includes('document.querySelector("#update-me")')
				),
				'`WithScripts.astro` hoisted script included unexpectedly.'
			).to.be.undefined;
		});

		it('Applies MDX components export', async () => {
			const html = await fixture.readFile('/launch-week-components-export/index.html');
			const $ = cheerio.load(html);

			const h2 = $('h2');
			expect(h2).to.have.a.lengthOf(1);
			expect(h2.attr('data-components-export-applied')).to.equal('true');
		});
	});

	describe('Build - SSR', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				output: 'server',
				root: './fixtures/content/',
				adapter: testAdapter(),
			});
			await fixture.build();
		});

		it('Includes CSS for rendered entry', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/launch-week');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			// Renders content
			expect($('ul li')).to.have.a.lengthOf(3);

			// Includes styles
			expect($('link[rel=stylesheet]')).to.have.a.lengthOf(1);
		});

		it('Exclude CSS for non-rendered entries', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			// Includes styles
			expect($('link[rel=stylesheet]')).to.have.a.lengthOf(0);
		});

		it('De-duplicates CSS used both in layout and directly in target page', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/with-layout-prop/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const set = new Set();

			$('link[rel=stylesheet]').each((_, linkEl) => {
				const href = linkEl.attribs.href;
				expect(set).to.not.contain(href);
				set.add(href);
			});

			$('style').each((_, styleEl) => {
				const textContent = styleEl.children[0].data;
				expect(set).to.not.contain(textContent);
				set.add(textContent);
			});
		});

		it('Applies MDX components export', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/launch-week-components-export');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const h2 = $('h2');
			expect(h2).to.have.a.lengthOf(1);
			expect(h2.attr('data-components-export-applied')).to.equal('true');
		});

		it('getCollection should return new instances of the array to be mutated safely', async () => {
			const app = await fixture.loadTestAdapterApp();

			let request = new Request('http://example.com/sort-blog-collection');
			let response = await app.render(request);
			let html = await response.text();
			let $ = cheerio.load(html);
			expect($('li').first().text()).to.equal('With Layout Prop');

			 request = new Request('http://example.com/');
			 response = await app.render(request);
			 html = await response.text();
			 $ = cheerio.load(html);
			expect($('li').first().text()).to.equal('Hello world');
		})
	});

	describe('Dev - SSG', () => {
		let devServer;
		/** @type {import('./test-utils').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/content/',
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Includes CSS for rendered entry', async () => {
			const response = await fixture.fetch('/launch-week', { method: 'GET' });
			expect(response.status).to.equal(200);

			const html = await response.text();
			const $ = cheerio.load(html);

			// Renders content
			expect($('ul li')).to.have.a.lengthOf(3);

			// Includes styles
			expect($('head > style')).to.have.a.lengthOf(1);
			expect($('head > style').text()).to.include("font-family: 'Comic Sans MS'");
		});

		it('Includes component scripts for rendered entry', async () => {
			const response = await fixture.fetch('/launch-week-component-scripts', { method: 'GET' });
			expect(response.status).to.equal(200);

			const html = await response.text();
			const $ = cheerio.load(html);

			const allScripts = $('head > script[src]');
			expect(allScripts).to.have.length;

			// Includes hoisted script
			expect(
				[...allScripts].find((script) => script.attribs.src.includes('WithScripts.astro')),
				'`WithScripts.astro` hoisted script missing from head.'
			).to.not.be.undefined;

			// Includes inline script
			expect($('script[data-is-inline]')).to.have.a.lengthOf(1);
		});

		it('Applies MDX components export', async () => {
			const response = await fixture.fetch('/launch-week-components-export', { method: 'GET' });
			expect(response.status).to.equal(200);

			const html = await response.text();
			const $ = cheerio.load(html);

			const h2 = $('h2');
			expect(h2).to.have.a.lengthOf(1);
			expect(h2.attr('data-components-export-applied')).to.equal('true');
		});

		it('Supports layout prop with recursive getCollection() call', async () => {
			const response = await fixture.fetch('/with-layout-prop', { method: 'GET' });
			expect(response.status).to.equal(200);

			const html = await response.text();
			const $ = cheerio.load(html);

			const body = $('body');
			expect(body.attr('data-layout-prop')).to.equal('true');

			const h1 = $('h1');
			expect(h1).to.have.a.lengthOf(1);
			expect(h1.text()).to.equal('With Layout Prop');

			const h2 = $('h2');
			expect(h2).to.have.a.lengthOf(1);
			expect(h2.text()).to.equal('Content with a layout prop');
		});
	});
});
