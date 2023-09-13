/**
 * CSS test
 * Run this test first! This uses quite a bit of memory, so prefixing with `0-` helps it start and finish early,
 * rather than trying to start up when all other threads are busy and having to fight for resources
 */

import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

/** @type {import('./test-utils').Fixture} */
let fixture;

describe('CSS', function () {
	before(async () => {
		fixture = await loadFixture({ root: './fixtures/0-css/' });
	});

	// test HTML and CSS contents for accuracy
	describe('build', () => {
		let $;
		let html;
		let bundledCSS;

		before(async () => {
			this.timeout(45000); // test needs a little more time in CI
			await fixture.build();

			// get bundled CSS (will be hashed, hence DOM query)
			html = await fixture.readFile('/index.html');
			$ = cheerio.load(html);
			const bundledCSSHREF = $('link[rel=stylesheet][href^=/_astro/]').attr('href');
			bundledCSS = (await fixture.readFile(bundledCSSHREF.replace(/^\/?/, '/')))
				.replace(/\s/g, '')
				.replace('/n', '');
		});

		describe('Astro Styles', () => {
			it('HTML and CSS scoped correctly', async () => {
				const el1 = $('#dynamic-class');
				const el2 = $('#dynamic-vis');
				const classes = $('#class');
				let scopedAttribute;
				for (const [key] of Object.entries(classes[0].attribs)) {
					if (/^data-astro-cid-[A-Za-z0-9-]+/.test(key)) {
						// Ema: this is ugly, but for reasons that I don't want to explore, cheerio
						// lower case the hash of the attribute
						scopedAttribute = key;
					}
				}
				if (!scopedAttribute) {
					throw new Error("Couldn't find scoped attribute");
				}

				// 1. check HTML
				expect(el1.attr('class')).to.equal(`blue`);
				expect(el2.attr('class')).to.equal(`visible`);

				// 2. check CSS
				const expected = `.blue[${scopedAttribute}],.color\\:blue[${scopedAttribute}]{color:#b0e0e6}.visible[${scopedAttribute}]{display:block}`;
				expect(bundledCSS).to.include(expected);
			});

			it('Generated link tags are void elements', async () => {
				expect(html).to.not.include('</link>');
			});

			it('No <style> skips scoping', async () => {
				// Astro component without <style> should not include scoped class
				expect($('#no-scope').attr('class')).to.equal(undefined);
			});

			it('Child inheritance', (done) => {
				for (const [key] of Object.entries($('#passed-in')[0].attribs)) {
					if (/^data-astro-cid-[A-Za-z0-9-]+/.test(key)) {
						done();
					}
				}
			});

			it('Using hydrated components adds astro-island styles', async () => {
				const inline = $('style').html();
				expect(inline).to.include('display:contents');
			});

			it('<style lang="sass">', async () => {
				expect(bundledCSS).to.match(new RegExp('h1\\[data-astro-cid-[^{]*{color:#90ee90}'));
			});

			it('<style lang="scss">', async () => {
				expect(bundledCSS).to.match(new RegExp('h1\\[data-astro-cid-[^{]*{color:#ff69b4}'));
			});
		});

		describe('Styles in src/', () => {
			it('.css', async () => {
				expect(bundledCSS).to.match(new RegExp('.linked-css[^{]*{color:gold'));
			});

			it('.sass', async () => {
				expect(bundledCSS).to.match(new RegExp('.linked-sass[^{]*{color:#789'));
			});

			it('.scss', async () => {
				expect(bundledCSS).to.match(new RegExp('.linked-scss[^{]*{color:#6b8e23'));
			});
		});

		describe('JSX', () => {
			it('.css', async () => {
				const el = $('#react-css');
				// 1. check HTML
				expect(el.attr('class')).to.include('react-title');
				// 2. check CSS
				expect(bundledCSS).to.include('.react-title');
			});

			it('.module.css', async () => {
				const el = $('#react-module-css');
				const classes = el.attr('class').split(' ');
				const moduleClass = classes.find((name) => /^_title_[A-Za-z0-9-_]+/.test(name));

				// 1. check HTML
				expect(el.attr('class')).to.include(moduleClass);

				// 2. check CSS
				expect(bundledCSS).to.match(new RegExp(`.${moduleClass}[^{]*{font-family:fantasy`));
			});

			it('.sass', async () => {
				const el = $('#react-sass');

				// 1. check HTML
				expect(el.attr('class')).to.include('react-sass-title');

				// 2. check CSS
				expect(bundledCSS).to.match(new RegExp(`.react-sass-title[^{]*{font-family:fantasy`));
			});

			it('.scss', async () => {
				const el = $('#react-scss');

				// 1. check HTML
				expect(el.attr('class')).to.include('react-scss-title');

				// 2. check CSS
				expect(bundledCSS).to.match(new RegExp(`.react-scss-title[^{]*{font-family:fantasy`));
			});

			it('.module.sass', async () => {
				const el = $('#react-module-sass');
				const classes = el.attr('class').split(' ');
				const moduleClass = classes.find((name) => /^_title_[A-Za-z0-9-_]+/.test(name));

				// 1. check HTML
				expect(el.attr('class')).to.include(moduleClass);

				// 2. check CSS
				expect(bundledCSS).to.match(new RegExp(`.${moduleClass}[^{]*{font-family:fantasy`));
			});

			it('.module.scss', async () => {
				const el = $('#react-module-scss');
				const classes = el.attr('class').split(' ');
				const moduleClass = classes.find((name) => /^_title_[A-Za-z0-9-_]+/.test(name));

				// 1. check HTML
				expect(el.attr('class')).to.include(moduleClass);

				// 2. check CSS
				expect(bundledCSS).to.match(new RegExp(`.${moduleClass}[^{]*{font-family:fantasy`));
			});
		});

		describe('Vue', () => {
			it('<style>', async () => {
				const el = $('#vue-css');

				// 1. check HTML
				expect(el.attr('class')).to.include('vue-css');

				// 2. check CSS
				expect(bundledCSS).to.match(new RegExp(`.vue-css[^{]*{font-family:cursive`));
			});

			it('<style scoped>', async () => {
				const el = $('#vue-scoped');

				// find data-v-* attribute (how Vue CSS scoping works)
				const { attribs } = el.get(0);
				const scopeId = Object.keys(attribs).find((k) => k.startsWith('data-v-'));
				expect(scopeId).to.be.ok;

				// 1. check HTML
				expect(el.attr('class')).to.include('vue-scoped');

				// 2. check CSS
				expect(bundledCSS).to.include(`.vue-scoped[${scopeId}]`);
			});

			it('<style module>', async () => {
				const el = $('#vue-modules');
				const classes = el.attr('class').split(' ');
				const moduleClass = classes.find((name) => /^_title_[A-Za-z0-9-_]+/.test(name));

				// 1. check HTML
				expect(el.attr('class')).to.include(moduleClass);

				// 2. check CSS
				expect(bundledCSS).to.match(new RegExp(`.${moduleClass}[^{]*{font-family:cursive`));
			});

			it('<style lang="sass">', async () => {
				const el = $('#vue-sass');

				// 1. check HTML
				expect(el.attr('class')).to.include('vue-sass');

				// 2. check CSS
				expect(bundledCSS).to.match(new RegExp(`.vue-sass[^{]*{font-family:cursive`));
			});

			it('<style lang="scss">', async () => {
				const el = $('#vue-scss');

				// 1. check HTML
				expect(el.attr('class')).to.include('vue-scss');

				// 2. check CSS
				expect(bundledCSS).to.match(new RegExp(`.vue-scss[^{]*{font-family:cursive`));
			});
		});

		describe('Svelte', () => {
			it('<style>', async () => {
				const el = $('#svelte-css');
				const classes = el.attr('class').split(' ');
				const scopedClass = classes.find(
					(name) => name !== 'svelte-css' && /^svelte-[A-Za-z0-9-]+/.test(name)
				);

				// 1. check HTML
				expect(el.attr('class')).to.include('svelte-css');

				// 2. check CSS
				expect(bundledCSS).to.match(
					new RegExp(`.svelte-css.${scopedClass}[^{]*{font-family:ComicSansMS`)
				);
			});

			it('<style lang="sass">', async () => {
				const el = $('#svelte-sass');
				const classes = el.attr('class').split(' ');
				const scopedClass = classes.find(
					(name) => name !== 'svelte-sass' && /^svelte-[A-Za-z0-9-]+/.test(name)
				);

				// 1. check HTML
				expect(el.attr('class')).to.include('svelte-sass');

				// 2. check CSS
				expect(bundledCSS).to.match(
					new RegExp(`.svelte-sass.${scopedClass}[^{]*{font-family:ComicSansMS`)
				);
			});

			it('<style lang="scss">', async () => {
				const el = $('#svelte-scss');
				const classes = el.attr('class').split(' ');
				const scopedClass = classes.find(
					(name) => name !== 'svelte-scss' && /^svelte-[A-Za-z0-9-]+/.test(name)
				);

				// 1. check HTML
				expect(el.attr('class')).to.include('svelte-scss');

				// 2. check CSS
				expect(bundledCSS).to.match(
					new RegExp(`.svelte-scss.${scopedClass}[^{]*{font-family:ComicSansMS`)
				);
			});

			it('client:only and SSR in two pages, both should have styles', async () => {
				const onlyHtml = await fixture.readFile('/client-only-and-ssr/only/index.html');
				const $onlyHtml = cheerio.load(onlyHtml);
				const onlyHtmlCssHref = $onlyHtml('link[rel=stylesheet][href^=/_astro/]').attr('href');
				const onlyHtmlCss = await fixture.readFile(onlyHtmlCssHref.replace(/^\/?/, '/'));

				const ssrHtml = await fixture.readFile('/client-only-and-ssr/ssr/index.html');
				const $ssrHtml = cheerio.load(ssrHtml);
				const ssrHtmlCssHref = $ssrHtml('link[rel=stylesheet][href^=/_astro/]').attr('href');
				const ssrHtmlCss = await fixture.readFile(ssrHtmlCssHref.replace(/^\/?/, '/'));

				expect(onlyHtmlCss).to.include('.svelte-only-and-ssr');
				expect(ssrHtmlCss).to.include('.svelte-only-and-ssr');
			});
		});

		describe('Vite features', () => {
			it('.css?raw return a string', () => {
				const el = $('#css-raw');
				expect(el.text()).to.equal('.foo {color: red;}');
			});
		});
	});

	// with "build" handling CSS checking, the dev tests are mostly testing the paths resolve in dev
	describe('dev', () => {
		let devServer;
		let $;

		before(async () => {
			devServer = await fixture.startDevServer();
			const html = await fixture.fetch('/').then((res) => res.text());
			$ = cheerio.load(html);
		});

		after(async () => {
			await devServer.stop();
		});

		it('resolves CSS in public/', async () => {
			const href = $('link[href="/global.css"]').attr('href');
			expect((await fixture.fetch(href)).status).to.equal(200);
		});

		// Skipped until upstream fix lands
		// Our fix: https://github.com/withastro/astro/pull/2106
		// OG Vite PR: https://github.com/vitejs/vite/pull/5940
		// Next Vite PR: https://github.com/vitejs/vite/pull/5796
		it.skip('resolved imported CSS with ?url', async () => {
			const href = $('link[href$="imported-url.css"]').attr('href');
			expect(href).to.be.ok;
			expect((await fixture.fetch(href)).status).to.equal(200);
		});

		it('resolves ESM style imports', async () => {
			const allInjectedStyles = $('style').text().replace(/\s*/g, '');

			expect(allInjectedStyles, 'styles/imported-url.css').to.contain('.imported{');
			expect(allInjectedStyles, 'styles/imported-url.sass').to.contain('.imported-sass{');
			expect(allInjectedStyles, 'styles/imported-url.scss').to.contain('.imported-scss{');
		});

		it('resolves Astro styles', async () => {
			const allInjectedStyles = $('style').text();

			expect(allInjectedStyles).to.contain('.linked-css[data-astro-cid-');
			expect(allInjectedStyles).to.contain('.linked-sass[data-astro-cid-');
			expect(allInjectedStyles).to.contain('.linked-scss[data-astro-cid-');
			expect(allInjectedStyles).to.contain('.wrapper[data-astro-cid-');
		});

		it('resolves Styles from React', async () => {
			const styles = [
				'ReactModules.module.css',
				'ReactModules.module.scss',
				'ReactModules.module.sass',
			];
			for (const style of styles) {
				const href = $(`link[href$="${style}"]`).attr('href');
				expect((await fixture.fetch(href)).status, style).to.equal(200);
			}

			const allInjectedStyles = $('style').text().replace(/\s*/g, '');

			expect(allInjectedStyles).to.contain('.react-title{');
			expect(allInjectedStyles).to.contain('.react-sass-title{');
			expect(allInjectedStyles).to.contain('.react-scss-title{');
		});

		it('resolves CSS from Svelte', async () => {
			const allInjectedStyles = $('style').text();

			expect(allInjectedStyles).to.contain('.svelte-css');
			expect(allInjectedStyles).to.contain('.svelte-sass');
			expect(allInjectedStyles).to.contain('.svelte-scss');
		});

		it('resolves CSS from Vue', async () => {
			const styles = ['VueModules.vue?vue&type=style&index=0&lang.module.scss'];
			for (const style of styles) {
				const href = $(`link[href$="${style}"]`).attr('href');
				expect((await fixture.fetch(href)).status, style).to.equal(200);
			}

			const allInjectedStyles = $('style').text().replace(/\s*/g, '');

			expect(allInjectedStyles).to.contain('.vue-css{');
			expect(allInjectedStyles).to.contain('.vue-sass{');
			expect(allInjectedStyles).to.contain('.vue-scss{');
			expect(allInjectedStyles).to.contain('.vue-scoped[data-v-');
		});

		it('remove unused styles from client:load components', async () => {
			const bundledAssets = await fixture.readdir('./_astro');
			// SvelteDynamic styles is already included in the main page css asset
			const unusedCssAsset = bundledAssets.find((asset) => /SvelteDynamic\..*\.css/.test(asset));
			expect(unusedCssAsset, 'Found unused style ' + unusedCssAsset).to.be.undefined;

			let foundVitePreloadCSS = false;
			const bundledJS = await fixture.glob('**/*.?(m)js');
			for (const filename of bundledJS) {
				const content = await fixture.readFile(filename);
				if (content.match(/ReactDynamic\..*\.css/)) {
					foundVitePreloadCSS = filename;
				}
			}
			expect(foundVitePreloadCSS).to.equal(
				false,
				'Should not have found a preload for the dynamic CSS'
			);
		});

		it('.css?raw return a string', () => {
			const el = $('#css-raw');
			expect(el.text()).to.equal('.foo {color: red;}');
		});
	});
});
