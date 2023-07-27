import { expect } from 'chai';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

const assetsPrefix = 'http://localhost:4321';
const assetsPrefixRegex = /^http:\/\/localhost:4321\/_astro\/.*/;

// Asset prefix for CDN support
describe('Assets Prefix - Static', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-assets-prefix/',
		});
		await fixture.build();
	});

	it('all stylesheets should start with assetPrefix', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const stylesheets = $('link[rel="stylesheet"]');
		stylesheets.each((i, el) => {
			expect(el.attribs.href).to.match(assetsPrefixRegex);
		});
	});

	it('image src start with assetsPrefix', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const imgAsset = $('#image-asset');
		expect(imgAsset.attr('src')).to.match(assetsPrefixRegex);
	});

	it('react component astro-island should import from assetsPrefix', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const island = $('astro-island');
		expect(island.attr('component-url')).to.match(assetsPrefixRegex);
		expect(island.attr('renderer-url')).to.match(assetsPrefixRegex);
	});

	it('import.meta.env.ASSETS_PREFIX works', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const env = $('#assets-prefix-env');
		expect(env.text()).to.equal(assetsPrefix);
	});

	it('markdown image src start with assetsPrefix', async () => {
		const html = await fixture.readFile('/markdown/index.html');
		const $ = cheerio.load(html);
		const imgAsset = $('img');
		expect(imgAsset.attr('src')).to.match(assetsPrefixRegex);
	});

	it('content collections image src start with assetsPrefix', async () => {
		const html = await fixture.readFile('/blog/index.html');
		const $ = cheerio.load(html);
		const imgAsset = $('img');
		expect(imgAsset.attr('src')).to.match(assetsPrefixRegex);
	});
});

describe('Assets Prefix - Static with path prefix', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-assets-prefix/',
			build: {
				assetsPrefix: '/starting-slash',
			},
		});
		await fixture.build();
	});

	it('all stylesheets should start with assetPrefix', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const stylesheets = $('link[rel="stylesheet"]');
		stylesheets.each((i, el) => {
			expect(el.attribs.href).to.match(/^\/starting-slash\/.*/);
		});
	});
});

describe('Assets Prefix - Server', () => {
	let app;

	before(async () => {
		const fixture = await loadFixture({
			root: './fixtures/astro-assets-prefix/',
			output: 'server',
			adapter: testAdapter(),
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	it('all stylesheets should start with assetPrefix', async () => {
		const request = new Request('http://example.com/custom-base/');
		const response = await app.render(request);
		expect(response.status).to.equal(200);
		const html = await response.text();
		const $ = cheerio.load(html);
		const stylesheets = $('link[rel="stylesheet"]');
		stylesheets.each((i, el) => {
			expect(el.attribs.href).to.match(assetsPrefixRegex);
		});
	});

	it('image src start with assetsPrefix', async () => {
		const request = new Request('http://example.com/custom-base/');
		const response = await app.render(request);
		expect(response.status).to.equal(200);
		const html = await response.text();
		const $ = cheerio.load(html);
		const imgAsset = $('#image-asset');
		expect(imgAsset.attr('src')).to.match(assetsPrefixRegex);
	});

	it('react component astro-island should import from assetsPrefix', async () => {
		const request = new Request('http://example.com/custom-base/');
		const response = await app.render(request);
		expect(response.status).to.equal(200);
		const html = await response.text();
		const $ = cheerio.load(html);
		const island = $('astro-island');
		expect(island.attr('component-url')).to.match(assetsPrefixRegex);
		expect(island.attr('renderer-url')).to.match(assetsPrefixRegex);
	});

	it('markdown optimized image src does not start with assetsPrefix in SSR', async () => {
		const request = new Request('http://example.com/custom-base/markdown/');
		const response = await app.render(request);
		expect(response.status).to.equal(200);
		const html = await response.text();
		const $ = cheerio.load(html);
		const imgAsset = $('img');
		expect(imgAsset.attr('src')).to.not.match(assetsPrefixRegex);
	});
});

describe('Assets Prefix - Server with path prefix', () => {
	let app;

	before(async () => {
		const fixture = await loadFixture({
			root: './fixtures/astro-assets-prefix/',
			output: 'server',
			adapter: testAdapter(),
			build: {
				assetsPrefix: '/starting-slash',
			},
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	it('all stylesheets should start with assetPrefix', async () => {
		const request = new Request('http://example.com/custom-base/');
		const response = await app.render(request);
		expect(response.status).to.equal(200);
		const html = await response.text();
		const $ = cheerio.load(html);
		const stylesheets = $('link[rel="stylesheet"]');
		stylesheets.each((i, el) => {
			expect(el.attribs.href).to.match(/^\/starting-slash\/.*/);
		});
	});
});
