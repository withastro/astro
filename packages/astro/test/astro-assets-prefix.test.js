import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

const assetsPrefix = 'http://localhost:4321';
const assetsPrefixRegex = /^http:\/\/localhost:4321\/_astro\/.*/;

// Asset prefix for CDN support
describe('Assets Prefix', () => {
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
});
