import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import eol from 'eol';
import { loadFixture } from './test-utils.js';

async function getCssContent($, fixture) {
	const contents = await Promise.all(
		$('link[rel=stylesheet][href^=/_astro/]').map((_, el) =>
			fixture.readFile(el.attribs.href.replace(/^\/?/, '/')),
		),
	);
	return contents.join('').replace(/\s/g, '').replace('/n', '');
}

describe('PostCSS', () => {
	let fixture;
	let bundledCSS;
	before(
		async () => {
			fixture = await loadFixture({
				root: './fixtures/postcss',
				// test suite was authored when inlineStylesheets defaulted to never
				build: { inlineStylesheets: 'never' },
			});
			await fixture.build();

			// get bundled CSS (will be hashed, hence DOM query)
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			bundledCSS = await getCssContent($, fixture);
		},
		{ timeout: 45000 },
	);

	/** All test cases check whether nested styles (i.e. &.nested {}) are correctly transformed */
	it('works in Astro page styles', () => {
		assert.match(bundledCSS, /\.astro-page\[data-astro-cid-.*?\]\.nested/);
	});

	it('works in Astro component styles', () => {
		assert.match(bundledCSS, /\.astro-component\[data-astro-cid-.*?\]\.nested/);
	});

	it('works in JSX', () => {
		assert.match(bundledCSS, /\.solid(\.[\w-]+)?\.nested/);
	});

	it('works in Vue', () => {
		assert.match(bundledCSS, /\.vue(\.[\w-]+)?\.nested/);
	});

	it('works in Svelte', () => {
		assert.match(bundledCSS, /\.svelte(\.[\w-]+)?\.nested/);
	});

	it('ignores CSS in public/', async () => {
		const publicCSS = (await fixture.readFile('/global.css'))
			.trim()
			.replace(/\s/g, '')
			.replace('/n', '');
		// neither minified nor prefixed
		assert.equal(eol.lf(publicCSS), '.global{appearance:none;}');
	});
});
