import { expect } from 'chai';
import cheerio from 'cheerio';
import eol from 'eol';
import { loadFixture } from './test-utils.js';

describe('PostCSS', () => {
	const PREFIXED_CSS = `{-webkit-appearance:none;appearance:none}`;

	let fixture;
	let bundledCSS;
	before(async () => {
		fixture = await loadFixture({
			projectRoot: './fixtures/postcss',
			renderers: ['@astrojs/renderer-solid', '@astrojs/renderer-svelte', '@astrojs/renderer-vue'],
		});
		await fixture.build();

		// get bundled CSS (will be hashed, hence DOM query)
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const bundledCSSHREF = $('link[rel=stylesheet][href^=/assets/]').attr('href');
		bundledCSS = await fixture.readFile(bundledCSSHREF.replace(/^\/?/, '/'));
	});

	it('works in Astro page styles', () => {
		expect(bundledCSS).to.match(new RegExp(`.astro-page.astro-[^{]+${PREFIXED_CSS}`));
	});

	it('works in Astro component styles', () => {
		expect(bundledCSS).to.match(new RegExp(`.astro-component.astro-[^{]+${PREFIXED_CSS}`));
	});

	it('works in JSX', () => {
		expect(bundledCSS).to.match(new RegExp(`.solid${PREFIXED_CSS}`));
	});

	it('works in Vue', () => {
		expect(bundledCSS).to.match(new RegExp(`.vue${PREFIXED_CSS}`));
	});

	it('works in Svelte', () => {
		expect(bundledCSS).to.match(new RegExp(`.svelte.s[^{]+${PREFIXED_CSS}`));
	});

	it('ignores CSS in public/', async () => {
		const publicCSS = await fixture.readFile('/global.css');
		// neither minified nor prefixed
		expect(eol.lf(publicCSS.trim())).to.equal(`.global {\n  appearance: none;\n}`);
	});
});
