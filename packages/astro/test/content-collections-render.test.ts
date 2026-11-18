import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.ts';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Content Collections - render()', () => {
	describe('Build - SSG', () => {
		let fixture: Fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/content/',
				// test suite was authored when inlineStylesheets defaulted to never
				build: { inlineStylesheets: 'never' },
				outDir: './dist/content-collections-render-build-ssg/',
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
		let fixture: Fixture;

		before(async () => {
			fixture = await loadFixture({
				output: 'server',
				root: './fixtures/content/',
				adapter: testAdapter(),
				// test suite was authored when inlineStylesheets defaulted to never
				build: { inlineStylesheets: 'never' },
				outDir: './dist/content-collections-render-build-ssr/',
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

			const set = new Set<string>();

			$('link[rel=stylesheet]').each((_, linkEl) => {
				const href = linkEl.attribs.href;
				assert.equal(set.has(href), false);
				set.add(href);
			});

			$('style').each((_, styleEl) => {
				const textContent = (styleEl.children[0] as { data: string }).data;
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
});
