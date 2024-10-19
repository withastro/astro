import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { isWindows, loadFixture } from './test-utils.js';

if (!isWindows) {
	describe('Experimental Content Collections cache - render()', () => {
		describe('Build - SSG', () => {
			/** @type {import('./test-utils.js').Fixture} */
			let fixture;

			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/content/',
					// test suite was authored when inlineStylesheets defaulted to never
					build: { inlineStylesheets: 'never' },
					experimental: {
						contentCollectionCache: true,
					},
				});
				await fixture.build();
			});

			after(async () => {
				await fixture.clean();
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

			it('De-duplicates CSS used both in layout and directly in target page', async () => {
				const html = await fixture.readFile('/with-layout-prop/index.html');
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

			it('Includes component scripts for rendered entry', async () => {
				const html = await fixture.readFile('/launch-week-component-scripts/index.html');
				const $ = cheerio.load(html);

				const allScripts = $('head > script[type="module"]');
				assert.ok(allScripts.length > 0);

				// Includes hoisted script
				assert.notEqual(
					[...allScripts].find((script) => $(script).attr('src')?.includes('/_astro/WithScripts')),
					undefined,
					'hoisted script missing from head.',
				);

				// Includes inline script
				assert.equal($('script[data-is-inline]').length, 1);
			});

			it('Excludes component scripts for non-rendered entries', async () => {
				const html = await fixture.readFile('/index.html');
				const $ = cheerio.load(html);

				const allScripts = $('head > script[type="module"]');

				// Excludes hoisted script
				assert.notEqual(
					[...allScripts].find((script) =>
						$(script).text().includes('document.querySelector("#update-me")'),
					),
					'`WithScripts.astro` hoisted script included unexpectedly.',
					undefined,
				);
			});

			it('Applies MDX components export', async () => {
				const html = await fixture.readFile('/launch-week-components-export/index.html');
				const $ = cheerio.load(html);

				const h2 = $('h2');
				assert.equal(h2.length, 1);
				assert.equal(h2.attr('data-components-export-applied'), 'true');
			});

			describe('Rebuild from cache', () => {
				before(async () => {
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

				it('content folder is cleaned', async () => {
					let found = true;
					try {
						await fixture.readFile('content/manifest.json');
					} catch {
						found = false;
					}
					assert.equal(found, false, 'manifest not in dist folder');
				});

				it('chunks folder is cleaned', async () => {
					const files = await fixture.readdir('');
					assert.equal(files.includes('chunks'), false, 'chunks folder removed');
				});

				it('hoisted script is built', async () => {
					const html = await fixture.readFile('/launch-week-component-scripts/index.html');
					const $ = cheerio.load(html);

					const allScripts = $('head > script[type="module"]');
					assert.ok(allScripts.length > 0);

					// Includes hoisted script
					assert.notEqual(
						[...allScripts].find((script) =>
							$(script).attr('src')?.includes('/_astro/WithScripts'),
						),
						undefined,
						'hoisted script missing from head.',
					);
				});
			});
		});
	});
}
