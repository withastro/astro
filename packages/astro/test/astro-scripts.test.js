import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Scripts (hoisted and not)', () => {
	describe('Build', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-scripts/',
				vite: {
					build: {
						assetsInlineLimit: 0,
					},
				},
			});
			await fixture.build();
		});

		it('Moves external scripts up', async () => {
			const html = await fixture.readFile('/external/index.html');
			const $ = cheerio.load(html);

			assert.equal($('head script[type="module"]:not([src="/regular_script.js"])').length, 1);
			assert.equal($('body script').length, 0);
		});

		it('Moves inline scripts up', async () => {
			const html = await fixture.readFile('/inline/index.html');
			const $ = cheerio.load(html);

			assert.equal($('head script[type="module"]').length, 1);
			assert.equal($('body script').length, 0);
		});

		it('Inline page builds the scripts to a single bundle', async () => {
			// Inline page
			let inline = await fixture.readFile('/inline/index.html');
			let $ = cheerio.load(inline);
			let $el = $('script');

			// test 1: Just one entry module
			assert.equal($el.length, 1);

			const src = $el.attr('src');
			const inlineEntryJS = await fixture.readFile(src);

			// test 3: the JS exists
			assert.ok(inlineEntryJS);

			// test 4: Inline imported JS is included
			assert.equal(
				inlineEntryJS.includes('I AM IMPORTED INLINE'),
				true,
				'The inline imported JS is included in the bundle',
			);
		});

		it("Inline scripts that are shared by multiple pages create chunks, and aren't inlined into the HTML", async () => {
			let html = await fixture.readFile('/inline-shared-one/index.html');
			let $ = cheerio.load(html);

			assert.equal($('script').length, 1);
			assert.notEqual($('script').attr('src'), undefined);
		});

		it('External page using non-hoist scripts that are modules are built standalone', async () => {
			let external = await fixture.readFile('/external-no-hoist/index.html');
			let $ = cheerio.load(external);

			// test 1: there is 1 scripts
			assert.equal($('script').length, 1);

			// test 2: inside assets
			let entryURL = $('script').attr('src');
			assert.equal(entryURL.includes('_astro/'), true);
		});

		it('External page using non-hoist scripts that are not modules are built standalone', async () => {
			let external = await fixture.readFile('/external-no-hoist-classic/index.html');
			let $ = cheerio.load(external);

			// test 1: there is 1 scripts
			assert.equal($('script').length, 1);

			// test 2: inside assets
			let entryURL = $('script').attr('src');
			assert.equal(entryURL.includes('_astro/'), true);
		});

		it('Scripts added via Astro.glob are hoisted', async () => {
			let glob = await fixture.readFile('/glob/index.html');
			let $ = cheerio.load(glob);

			assert.equal($('script[type="module"]').length > 0, true);
		});

		it('Styles imported by hoisted scripts are included on the page', async () => {
			let html = await fixture.readFile('/with-styles/index.html');
			let $ = cheerio.load(html);

			// Imported styles + tailwind
			assert.equal($('link[rel=stylesheet]').length, 2);
		});

		describe('Inlining', () => {
			/** @type {import('./test-utils').Fixture} */
			// eslint-disable-next-line @typescript-eslint/no-shadow
			let fixture;
			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/astro-scripts/',
				});
				await fixture.build();
			});

			it('External page builds the hoisted scripts to a single bundle', async () => {
				let external = await fixture.readFile('/external/index.html');
				let $ = cheerio.load(external);

				// test 1: there are two scripts
				assert.equal($('script').length, 2);

				let el = $('script').get(1);
				assert.equal($(el).attr('src'), undefined, 'This should have been inlined');
				let externalEntryJS = $(el).text();

				// test 2: the JS exists
				assert.ok(externalEntryJS);
			});
		});
	});

	describe('Dev', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;
		/** @type {import('./test-utils').DevServer} */
		let devServer;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-scripts/',
				integrations: [
					{
						name: 'test-script-injection-with-injected-route',
						hooks: {
							'astro:config:setup': ({ injectRoute, injectScript }) => {
								injectScript('page', `import '/src/scripts/something.js';`);
								injectRoute({ pattern: 'injected-route', entrypoint: 'src/external-page.astro' });
							},
						},
					},
				],
				vite: {
					build: {
						assetsInlineLimit: 0,
					},
				},
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Scripts added via Astro.glob are hoisted', async () => {
			let res = await fixture.fetch('/glob');
			let html = await res.text();
			let $ = cheerio.load(html);

			let found = 0;
			let moduleScripts = $('[type=module]');
			moduleScripts.each((_i, el) => {
				if (
					$(el).attr('src').includes('Glob/GlobComponent.astro?astro&type=script&index=0&lang.ts')
				) {
					found++;
				}
			});
			assert.equal(found, 1);
		});

		it('Using injectScript does not interfere', async () => {
			let res = await fixture.fetch('/inline-in-page');
			let html = await res.text();
			let $ = cheerio.load(html);
			let found = 0;
			let moduleScripts = $('[type=module]');
			moduleScripts.each((_i, el) => {
				if ($(el).attr('src').includes('?astro&type=script&index=0&lang.ts')) {
					found++;
				}
			});
			assert.equal(found, 1);
		});

		it('Injected scripts are injected to injected routes', async () => {
			let res = await fixture.fetch('/injected-route');
			let html = await res.text();
			let $ = cheerio.load(html);
			let found = 0;
			let moduleScripts = $('[type=module]');
			moduleScripts.each((_i, el) => {
				if ($(el).attr('src').includes('@id/astro:scripts/page.js')) {
					found++;
				}
			});
			assert.equal(found, 1);
		});
	});
});
