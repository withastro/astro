import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('Content Collections - render()', () => {
	describe('Build - SSG', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/content/',
				// test suite was authored when inlineStylesheets defaulted to never
				build: { inlineStylesheets: 'never' },
			});
			await fixture.build();
		});

		it('Includes CSS for rendered entry', async () => {
			const html = await fixture.readFile('/launch-week/index.html');
			const $ = cheerio.load(html);

			// Renders content
			assert.equal($('ul li').length, 3);

			// Includes styles
			assert.equal($('link[rel=stylesheet]').length, 1);
		});

		it('Excludes CSS for non-rendered entries', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			// Excludes styles
			assert.equal($('link[rel=stylesheet]').length, 0);
		});

		it('Includes component scripts for rendered entry', async () => {
			const html = await fixture.readFile('/launch-week-component-scripts/index.html');
			const $ = cheerio.load(html);

			// Includes script
			assert.equal($('script[type="module"]').length, 1);

			// Includes inline script
			assert.equal($('script[data-is-inline]').length, 1);
		});

		it('Excludes component scripts for non-rendered entries', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			assert.equal($('script').length, 0);
		});

		it('Applies MDX components export', async () => {
			const html = await fixture.readFile('/launch-week-components-export/index.html');
			const $ = cheerio.load(html);

			const h2 = $('h2');
			assert.equal(h2.length, 1);
			assert.equal(h2.attr('data-components-export-applied'), 'true');
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
				// test suite was authored when inlineStylesheets defaulted to never
				build: { inlineStylesheets: 'never' },
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
			assert.equal($('ul li').length, 3);

			// Includes styles
			assert.equal($('link[rel=stylesheet]').length, 1);
		});

		it('Exclude CSS for non-rendered entries', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			// Includes styles
			assert.equal($('link[rel=stylesheet]').length, 0);
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
				assert.equal(set.has(href), false);
				set.add(href);
			});

			$('style').each((_, styleEl) => {
				const textContent = styleEl.children[0].data;
				assert.equal(set.has(textContent), false);
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
			assert.equal(h2.length, 1);
			assert.equal(h2.attr('data-components-export-applied'), 'true');
		});

		it('getCollection should return new instances of the array to be mutated safely', async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/get-collection-equality');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);
			assert.equal($('[data-are-equal]').first().text(), 'false');
		});
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
			assert.equal(response.status, 200);

			const html = await response.text();
			const $ = cheerio.load(html);

			// Renders content
			assert.equal($('ul li').length, 3);

			// Includes styles
			assert.equal($('head > style').length, 1);
			assert.ok($('head > style').text().includes("font-family: 'Comic Sans MS'"));
		});

		it('Includes component scripts for rendered entry', async () => {
			const response = await fixture.fetch('/launch-week-component-scripts', { method: 'GET' });
			assert.equal(response.status, 200);

			const html = await response.text();
			const $ = cheerio.load(html);

			// Includes script
			assert.equal($('script[type="module"][src*="WithScripts.astro"]').length, 1);

			// Includes inline script
			assert.equal($('script[data-is-inline]').length, 1);
		});

		it('Applies MDX components export', async () => {
			const response = await fixture.fetch('/launch-week-components-export', { method: 'GET' });
			assert.equal(response.status, 200);

			const html = await response.text();
			const $ = cheerio.load(html);

			const h2 = $('h2');
			assert.equal(h2.length, 1);
			assert.equal(h2.attr('data-components-export-applied'), 'true');
		});

		it('Stops collecting CSS when reaching a propagation stopping point', async () => {
			let response = await fixture.fetch('/blog/5-big-news', { method: 'GET' });
			assert.equal(response.status, 200);

			let html = await response.text();
			let $ = cheerio.load(html);

			// Includes the red button styles used in the MDX blog post
			// CSS may be minified (background-color:red) or pretty-printed (background-color: red)
			assert.match($('head > style').text(), /background-color:\s*red/);

			response = await fixture.fetch('/blog/about', { method: 'GET' });
			assert.equal(response.status, 200);

			html = await response.text();
			$ = cheerio.load(html);

			// Does not include the red button styles not used in this page
			assert.doesNotMatch($('head > style').text(), /background-color:\s*red/);
		});
	});
});
