import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import { tailwind } from './fixtures/astro-scripts/deps.mjs';

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

			expect($('head script[type="module"]:not([src="/regular_script.js"])')).to.have.lengthOf(1);
			expect($('body script')).to.have.lengthOf(0);
		});

		it('Moves inline scripts up', async () => {
			const html = await fixture.readFile('/inline/index.html');
			const $ = cheerio.load(html);

			expect($('head script[type="module"]')).to.have.lengthOf(1);
			expect($('body script')).to.have.lengthOf(0);
		});

		it('Inline page builds the scripts to a single bundle', async () => {
			// Inline page
			let inline = await fixture.readFile('/inline/index.html');
			let $ = cheerio.load(inline);
			let $el = $('script');

			// test 1: Just one entry module
			expect($el).to.have.lengthOf(1);

			const src = $el.attr('src');
			const inlineEntryJS = await fixture.readFile(src);

			// test 3: the JS exists
			expect(inlineEntryJS).to.be.ok;

			// test 4: Inline imported JS is included
			expect(inlineEntryJS).to.contain(
				'I AM IMPORTED INLINE',
				'The inline imported JS is included in the bundle'
			);
		});

		it("Inline scripts that are shared by multiple pages create chunks, and aren't inlined into the HTML", async () => {
			let html = await fixture.readFile('/inline-shared-one/index.html');
			let $ = cheerio.load(html);

			expect($('script')).to.have.lengthOf(1);
			expect($('script').attr('src')).to.not.equal(undefined);
		});

		it('External page using non-hoist scripts that are modules are built standalone', async () => {
			let external = await fixture.readFile('/external-no-hoist/index.html');
			let $ = cheerio.load(external);

			// test 1: there is 1 scripts
			expect($('script')).to.have.lengthOf(1);

			// test 2: inside assets
			let entryURL = $('script').attr('src');
			expect(entryURL.includes('_astro/')).to.equal(true);
		});

		it('External page using non-hoist scripts that are not modules are built standalone', async () => {
			let external = await fixture.readFile('/external-no-hoist-classic/index.html');
			let $ = cheerio.load(external);

			// test 1: there is 1 scripts
			expect($('script')).to.have.lengthOf(1);

			// test 2: inside assets
			let entryURL = $('script').attr('src');
			expect(entryURL.includes('_astro/')).to.equal(true);
		});

		it('Scripts added via Astro.glob are hoisted', async () => {
			let glob = await fixture.readFile('/glob/index.html');
			let $ = cheerio.load(glob);

			expect($('script[type="module"]').length).to.be.greaterThan(0);
		});

		it('Styles imported by hoisted scripts are included on the page', async () => {
			let html = await fixture.readFile('/with-styles/index.html');
			let $ = cheerio.load(html);

			// Imported styles + tailwind
			expect($('link[rel=stylesheet]')).to.have.a.lengthOf(2);
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
				expect($('script')).to.have.lengthOf(2);

				let el = $('script').get(1);
				expect($(el).attr('src')).to.equal(undefined, 'This should have been inlined');
				let externalEntryJS = $(el).text();

				// test 2: the JS exists
				expect(externalEntryJS).to.be.ok;
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
					tailwind(),
					{
						name: 'test-script-injection-with-injected-route',
						hooks: {
							'astro:config:setup': ({ injectRoute, injectScript }) => {
								injectScript('page', `import '/src/scripts/something.js';`);
								injectRoute({ pattern: 'injected-route', entryPoint: 'src/external-page.astro' });
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
			moduleScripts.each((i, el) => {
				if (
					$(el).attr('src').includes('Glob/GlobComponent.astro?astro&type=script&index=0&lang.ts')
				) {
					found++;
				}
			});
			expect(found).to.equal(1);
		});

		it('Using injectScript does not interfere', async () => {
			let res = await fixture.fetch('/inline-in-page');
			let html = await res.text();
			let $ = cheerio.load(html);
			let found = 0;
			let moduleScripts = $('[type=module]');
			moduleScripts.each((i, el) => {
				if ($(el).attr('src').includes('?astro&type=script&index=0&lang.ts')) {
					found++;
				}
			});
			expect(found).to.equal(1);
		});

		it('Injected scripts are injected to injected routes', async () => {
			let res = await fixture.fetch('/injected-route');
			let html = await res.text();
			let $ = cheerio.load(html);
			let found = 0;
			let moduleScripts = $('[type=module]');
			moduleScripts.each((i, el) => {
				if ($(el).attr('src').includes('@id/astro:scripts/page.js')) {
					found++;
				}
			});
			expect(found).to.equal(1);
		});
	});
});
