import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';

describe('Setting inlineStylesheets to never in static output', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/css-inline-stylesheets/never/',
			output: 'static',
			experimental: {
				inlineStylesheets: 'never',
			},
		});
		await fixture.build();
	});

	it('Does not render any <style> tags', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		expect($('style').toArray()).to.be.empty;
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

describe('Setting inlineStylesheets to never in server output', () => {
	let app;

	before(async () => {
		const fixture = await loadFixture({
			root: './fixtures/css-inline-stylesheets/never/',
			output: 'server',
			adapter: testAdapter(),
			experimental: {
				inlineStylesheets: 'never',
			},
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	it('Does not render any <style> tags', async () => {
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerio.load(html);

		expect($('style').toArray()).to.be.empty;
	});

	describe('Inspect linked stylesheets', () => {
		const allStyles = {};

		before(async () => {
			allStyles.value = await stylesFromServer(app);
		});

		commonExpectations(allStyles);
	});
});

describe('Setting inlineStylesheets to auto in static output', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/css-inline-stylesheets/auto/',
			output: 'static',
			experimental: {
				inlineStylesheets: 'auto',
			},
			vite: {
				build: {
					assetsInlineLimit: 512,
				},
			},
		});
		await fixture.build();
	});

	it('Renders some <style> and some <link> tags', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		// the count of style/link tags depends on our css chunking logic
		// this test should be updated if it changes
		expect($('style')).to.have.lengthOf(3);
		expect($('link[rel=stylesheet]')).to.have.lengthOf(1);
	});

	describe('Inspect linked and inlined stylesheets', () => {
		const allStyles = {};

		before(async () => {
			allStyles.value = await stylesFromStaticOutput(fixture);
		});

		commonExpectations(allStyles);
	});
});

describe('Setting inlineStylesheets to auto in server output', () => {
	let app;

	before(async () => {
		const fixture = await loadFixture({
			root: './fixtures/css-inline-stylesheets/auto/',
			output: 'server',
			adapter: testAdapter(),
			experimental: {
				inlineStylesheets: 'auto',
			},
			vite: {
				build: {
					assetsInlineLimit: 512,
				},
			},
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	it('Renders some <style> and some <link> tags', async () => {
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerio.load(html);

		// the count of style/link tags depends on our css chunking logic
		// this test should be updated if it changes
		expect($('style')).to.have.lengthOf(3);
		expect($('link[rel=stylesheet]')).to.have.lengthOf(1);
	});

	describe('Inspect linked and inlined stylesheets', () => {
		const allStyles = {};

		before(async () => {
			allStyles.value = await stylesFromServer(app);
		});

		commonExpectations(allStyles);
	});
});

describe('Setting inlineStylesheets to always in static output', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/css-inline-stylesheets/always/',
			output: 'static',
			experimental: {
				inlineStylesheets: 'always',
			},
		});
		await fixture.build();
	});

	it('Does not render any <link> tags', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		expect($('link[rel=stylesheet]').toArray()).to.be.empty;
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

	before(async () => {
		const fixture = await loadFixture({
			root: './fixtures/css-inline-stylesheets/always/',
			output: 'server',
			adapter: testAdapter(),
			experimental: {
				inlineStylesheets: 'always',
			},
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	it('Does not render any <link> tags', async () => {
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerio.load(html);

		expect($('link[rel=stylesheet]').toArray()).to.be.empty;
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
		})
	);
	const allLinkedStyles = allLinkedStylesheets.join('');

	const styles = $('style');
	const allInlinedStylesheets = styles.map((_, styleEl) => styleEl.children[0].data).toArray();
	const allInlinedStyles = allInlinedStylesheets.join('');
	return allLinkedStyles + allInlinedStyles;
}

function commonExpectations(allStyles) {
	it('Includes all authored css', () => {
		// authored in imported.css
		expect(allStyles.value).to.include('.bg-lightcoral');

		// authored in index.astro
		expect(allStyles.value).to.include('#welcome');

		// authored in components/Button.astro
		expect(allStyles.value).to.include('.variant-outline');

		// authored in layouts/Layout.astro
		expect(allStyles.value).to.include('Menlo');
	});

	it('Styles used both in content layout and directly in page are included only once', () => {
		// authored in components/Button.astro
		expect(allStyles.value.match(/cubic-bezier/g)).to.have.lengthOf(1);
	});
}
