import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;
const IMPORTED_ASTRO_COMPONENT_ID = 'imported-astro-component';

describe('Imported markdown CSS', function () {
	before(async () => {
		fixture = await loadFixture({ root: './fixtures/astro-markdown-css/' });
	});
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
			bundledCSS = await fixture.readFile(bundledCSSHREF.replace(/^\/?/, '/'));
		});

		it('Compiles styles for Astro components within imported markdown', () => {
			const importedAstroComponent = $(`#${IMPORTED_ASTRO_COMPONENT_ID}`)?.[0];
			expect(importedAstroComponent?.name).to.equal('h2');
			const cssClass = $(importedAstroComponent).attr('class')?.split(/\s+/)?.[0];

			expect(bundledCSS).to.match(new RegExp(`h2.${cssClass}{color:#00f}`));
		});
	});
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

		it('Compiles styles for Astro components within imported markdown', async () => {
			const importedAstroComponent = $(`#${IMPORTED_ASTRO_COMPONENT_ID}`)?.[0];
			expect(importedAstroComponent?.name).to.equal('h2');
			const cssClass = $(importedAstroComponent).attr('class')?.split(/\s+/)?.[0];

			const astroCSSHREF = $('link[rel=stylesheet][href^=/src/components/Visual.astro]').attr(
				'href'
			);
			const css = await fixture.fetch(astroCSSHREF.replace(/^\/?/, '/')).then((res) => res.text());
			expect(css).to.match(new RegExp(`h2.${cssClass}{color:#00f}`));
		});
	});
});
