import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('Experimental Content Collections cache inlineStylesheets', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			// inconsequential config that differs between tests
			// to bust cache and prevent modules and their state
			// from being reused
			site: 'https://test.dev/',
			root: './fixtures/css-inline-stylesheets-2/',
			output: 'static',
			build: {
				inlineStylesheets: 'never',
			},
			experimental: {
				contentCollectionCache: true,
			},
		});
		await fixture.build();
	});

	after(async () => await fixture.clean());

	it('Does not render any <style> tags', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		assert.equal($('style').toArray().length, 0);
	});

	describe('Inspect linked stylesheets', () => {
		// object, so it can be passed by reference
		const allStyles = {};

		before(async () => {
			allStyles.value = await stylesFromStaticOutput(fixture);
		});

		commonExpectations(allStyles);
	});
});

describe('Experimental Content Collections cache - inlineStylesheets to never in server output', () => {
	let app;
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			// inconsequential config that differs between tests
			// to bust cache and prevent modules and their state
			// from being reused
			site: 'https://test.dev/',
			root: './fixtures/css-inline-stylesheets/',
			output: 'server',
			adapter: testAdapter(),
			outDir: './dist/inline-stylesheets-never',
			build: {
				client: './dist/inline-stylesheets-never/client',
				server: './dist/inline-stylesheets-never/server',
				inlineStylesheets: 'never',
			},
			experimental: {
				contentCollectionCache: true,
			},
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	after(async () => await fixture.clean());

	it('Does not render any <style> tags', async () => {
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerio.load(html);

		assert.equal($('style').toArray().length, 0);
	});

	describe('Inspect linked stylesheets', () => {
		const allStyles = {};

		before(async () => {
			allStyles.value = await stylesFromServer(app);
		});

		commonExpectations(allStyles);
	});
});

describe('Experimental Content Collections cache - inlineStylesheets to auto in static output', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			// inconsequential config that differs between tests
			// to bust cache and prevent modules and their state
			// from being reused
			site: 'https://test.info/',
			root: './fixtures/css-inline-stylesheets/',
			output: 'static',
			outDir: './dist/inline-stylesheets-auto',
			build: {
				client: './dist/inline-stylesheets-auto/client',
				server: './dist/inline-stylesheets-auto/server',
				inlineStylesheets: 'auto',
			},
			vite: {
				build: {
					assetsInlineLimit: 512,
				},
			},
			experimental: {
				contentCollectionCache: true,
			},
		});
		await fixture.build();
	});

	after(async () => await fixture.clean());

	it(
		'Renders some <style> and some <link> tags',
		{ todo: 'Styles have the wrong length' },
		async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			// the count of style/link tags depends on our css chunking logic
			// this test should be updated if it changes
			assert.equal($('style').length, 3);
			assert.equal($('link[rel=stylesheet]').length, 1);
		},
	);

	describe('Inspect linked and inlined stylesheets', () => {
		const allStyles = {};

		before(async () => {
			allStyles.value = await stylesFromStaticOutput(fixture);
		});

		commonExpectations(allStyles);
	});
});

describe('Setting inlineStylesheets to always in static output', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			// inconsequential config that differs between tests
			// to bust cache and prevent modules and their state
			// from being reused
			site: 'https://test.net/',
			// TODO: Uses -3 variant to bust ESM module cache when rendering the pages. Particularly in
			// `node_modules/.astro/content/entry.mjs` and `import('./en/endeavour.mjs')`. Ideally this
			// should be solved in core, but using this workaround for now.
			root: './fixtures/css-inline-stylesheets-3/',
			output: 'static',
			build: {
				inlineStylesheets: 'always',
			},
			experimental: {
				contentCollectionCache: true,
			},
		});
		await fixture.build();
	});

	after(async () => await fixture.clean());

	it('Does not render any <link> tags', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		assert.equal($('link[rel=stylesheet]').toArray().length, 0);
	});

	describe('Inspect inlined stylesheets', () => {
		const allStyles = {};

		before(async () => {
			allStyles.value = await stylesFromStaticOutput(fixture);
		});

		commonExpectations(allStyles);
	});
});

describe('Setting inlineStylesheets to always in server output', () => {
	let app;
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			// inconsequential config that differs between tests
			// to bust cache and prevent modules and their state
			// from being reused
			site: 'https://test.net/',
			root: './fixtures/css-inline-stylesheets/',
			output: 'server',
			adapter: testAdapter(),
			outDir: './dist/inline-stylesheets-always',
			build: {
				client: './dist/inline-stylesheets-always/client',
				server: './dist/inline-stylesheets-always/server',
				inlineStylesheets: 'always',
			},
			experimental: {
				contentCollectionCache: true,
			},
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	after(async () => await fixture.clean());

	it('Does not render any <link> tags', async () => {
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerio.load(html);

		assert.equal($('link[rel=stylesheet]').toArray().length, 0);
	});

	describe('Inspect inlined stylesheets', () => {
		const allStyles = {};

		before(async () => {
			allStyles.value = await stylesFromServer(app);
		});

		commonExpectations(allStyles);
	});
});

async function stylesFromStaticOutput(fixture) {
	const html = await fixture.readFile('/index.html');
	const $ = cheerio.load(html);

	const links = $('link[rel=stylesheet]');
	const hrefs = links.map((_, linkEl) => linkEl.attribs.href).toArray();
	const allLinkedStylesheets = await Promise.all(hrefs.map((href) => fixture.readFile(href)));
	const allLinkedStyles = allLinkedStylesheets.join('');

	const styles = $('style');
	const allInlinedStylesheets = styles.map((_, styleEl) => styleEl.children[0].data).toArray();
	const allInlinedStyles = allInlinedStylesheets.join('');

	return allLinkedStyles + allInlinedStyles;
}

async function stylesFromServer(app) {
	const request = new Request('http://example.com/');
	const response = await app.render(request);
	const html = await response.text();
	const $ = cheerio.load(html);

	const links = $('link[rel=stylesheet]');
	const hrefs = links.map((_, linkEl) => linkEl.attribs.href).toArray();
	const allLinkedStylesheets = await Promise.all(
		hrefs.map(async (href) => {
			const cssRequest = new Request(`http://example.com${href}`);
			const cssResponse = await app.render(cssRequest);
			return await cssResponse.text();
		}),
	);
	const allLinkedStyles = allLinkedStylesheets.join('');

	const styles = $('style');
	const allInlinedStylesheets = styles.map((_, styleEl) => styleEl.children[0].data).toArray();
	const allInlinedStyles = allInlinedStylesheets.join('');
	return allLinkedStyles + allInlinedStyles;
}

function commonExpectations(allStyles) {
	it.skip(
		'Includes all authored css',
		{ todo: 'Styles seem to return something different' },
		() => {
			// authored in imported.css
			assert.equal(allStyles.value.includes('.bg-lightcoral'), true);

			// authored in index.astro
			assert.equal(allStyles.value.includes('#welcome'), true);

			// authored in components/Button.astro
			assert.equal(allStyles.value.includes('.variant-outline'), true);

			// authored in layouts/Layout.astro
			assert.equal(allStyles.value.includes('Menlo'), true);
		},
	);

	it('Styles used both in content layout and directly in page are included only once', () => {
		// authored in components/Button.astro
		assert.equal(allStyles.value.match(/cubic-bezier/g).length, 1);
	});
}
