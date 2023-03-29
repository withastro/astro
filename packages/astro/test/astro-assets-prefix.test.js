import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

const assetsPrefix = 'http://localhost:4321';

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
			expect(el.attribs.href).to.include(assetsPrefix);
		});
	});

	it('image src start with assetsPrefix', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const img = $('#image-import');
		expect(img.attr('src')).to.include(assetsPrefix);
	});

	it('react component astro-island should import from assetsPrefix', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const island = $('astro-island');
		expect(island.attr('component-url')).to.include(assetsPrefix);
		expect(island.attr('renderer-url')).to.include(assetsPrefix);
	});

	it('import.meta.env.ASSETS_PREFIX works', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const env = $('#assets-prefix-env');
		expect(env.text()).to.equal(assetsPrefix);
	});
});
