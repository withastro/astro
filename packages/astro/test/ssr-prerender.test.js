import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';

describe('SSR: prerender', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-prerender/',
			output: 'server',
			adapter: testAdapter(),
			experimental: {
				prerender: true,
			},
		});
		await fixture.build();
	});

	describe('Prerendering', () => {
		it('Prerenders static page', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/static?q=42');
			const response = await app.render(request);
			expect(response.status).to.equal(200);
			const html = await response.text();
			const $ = cheerio.load(html);
			expect($('#greeting').text()).to.equal('Hello world!');
			expect($('#searchparams').text()).to.equal('');
		});

		it('includes prerendered pages in the asset manifest', async () => {
			const app = await fixture.loadTestAdapterApp();
			/** @type {Set<string>} */
			const assets = app.manifest.assets;
			expect(assets.size).to.equal(1);
			expect(Array.from(assets)[0].endsWith('.html')).to.be.true;
		});
	});

	describe('Astro.params in SSR', () => {
		it('Params are passed to component', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/users/houston');
			const response = await app.render(request);
			expect(response.status).to.equal(200);
			const html = await response.text();
			const $ = cheerio.load(html);
			expect($('.user').text()).to.equal('houston');
		});
	});
});
