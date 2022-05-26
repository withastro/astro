/**
 * CSS test
 * Run this test first! This uses quite a bit of memory, so prefixing with `0-` helps it start and finish early,
 * rather than trying to start up when all other threads are busy and having to fight for resources
 */

import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

describe('CSS', function () {
	before(async () => {
		fixture = await loadFixture({ root: './fixtures/0-css/' });
	});

	// test HTML and CSS contents for accuracy
	describe('build', () => {
		let $;
		let bundledCSS;

		before(async () => {
			this.timeout(45000); // test needs a little more time in CI
			await fixture.build();

			// get bundled CSS (will be hashed, hence DOM query)
			const html = await fixture.readFile('/index.html');
			$ = cheerio.load(html);
			const bundledCSSHREF = $('link[rel=stylesheet][href^=/assets/]').attr('href');
			bundledCSS = (await fixture.readFile(bundledCSSHREF.replace(/^\/?/, '/')))
				.replace(/\s/g, '').replace('/n', '');
		});

		describe('Astro Styles', () => {
			it('HTML and CSS scoped correctly', async () => {
				const el1 = $('#dynamic-class');
				const el2 = $('#dynamic-vis');
				const classes = $('#class').attr('class').split(' ');
				const scopedClass = classes.find((name) => /^astro-[A-Za-z0-9-]+/.test(name));

				// 1. check HTML
				expect(el1.attr('class')).to.equal(`blue ${scopedClass}`);
				expect(el2.attr('class')).to.equal(`visible ${scopedClass}`);

				// 2. check CSS
				const expected = `.blue.${scopedClass}{color:#b0e0e6}.color\\\\:blue.${scopedClass}{color:#b0e0e6}.visible.${scopedClass}{display:block}`;
				expect(bundledCSS).to.include(expected);
			});

			it('No <style> skips scoping', async () => {
				// Astro component without <style> should not include scoped class
				expect($('#no-scope').attr('class')).to.equal(undefined);
			});

			it('Child inheritance', async () => {
				expect($('#passed-in').attr('class')).to.match(/outer astro-[A-Z0-9]+ astro-[A-Z0-9]+/);
			});

			it('Using hydrated components adds astro-root styles', async () => {
				const inline = $('style').html();
				expect(inline).to.include('display: contents');
			});

			it('<style lang="sass">', async () => {
				expect(bundledCSS).to.match(new RegExp('h1.astro-[^{]*{color:#90ee90}'));
			});

			it('<style lang="scss">', async () => {
				expect(bundledCSS).to.match(new RegExp('h1.astro-[^{]*{color:#ff69b4}'));
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

		it('resolves Astro styles', async () => {
			const astroPageCss = $('link[rel=stylesheet][href^=/src/pages/index.astro?astro&type=style]');
			expect(astroPageCss.length).to.equal(
				4,
				'The index.astro page should generate 4 stylesheets, 1 for each <style> tag on the page.'
			);
		});

		it('resolves Styles from React', async () => {
			const styles = [
				'ReactCSS.css',
				'ReactModules.module.css',
				'ReactModules.module.scss',
				'ReactModules.module.sass',
				'ReactSass.sass',
				'ReactScss.scss',
			];
			for (const style of styles) {
				const href = $(`link[href$="${style}"]`).attr('href');
				expect((await fixture.fetch(href)).status, style).to.equal(200);
			}
		});

		it('resolves CSS from Svelte', async () => {
			const scripts = [
				'SvelteCSS.svelte?svelte&type=style&lang.css',
				'SvelteSass.svelte?svelte&type=style&lang.css',
				'SvelteScss.svelte?svelte&type=style&lang.css',
			];
			for (const script of scripts) {
				const src = $(`script[src$="${script}"]`).attr('src');
				expect((await fixture.fetch(src)).status, script).to.equal(200);
			}
		});

		it('resolves CSS from Vue', async () => {
			const styles = [
				'VueCSS.vue?vue&type=style&index=0&lang.css',
				'VueModules.vue?vue&type=style&index=0&lang.module.scss',
				'VueSass.vue?vue&type=style&index=0&lang.sass',
				'VueScoped.vue?vue&type=style&index=0&scoped=true&lang.css',
				'VueScss.vue?vue&type=style&index=0&lang.scss',
			];
			for (const style of styles) {
				const href = $(`link[href$="${style}"]`).attr('href');
				expect((await fixture.fetch(href)).status, style).to.equal(200);
			}
		});
	});
});
