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
		});
		await fixture.build();
	});

	describe('Prerendering', () => {
		// Prerendered assets are not served directly by `app`,
		// they're served _in front of_ the app as static assets!
		it('Does not render static page', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/static');
			const response = await app.render(request);
			expect(response.status).to.equal(404);
		});

		it('includes prerendered pages in the asset manifest', async () => {
			const app = await fixture.loadTestAdapterApp();
			/** @type {Set<string>} */
			const assets = app.manifest.assets;
			expect(assets).to.contain('/static/index.html');
		});

		it('prerenders a 500 route', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/fivehundred');
			const response1 = await app.render(request);
			const response2 = await app.render(request);
			const response3 = await app.render(request);

			expect(response1.status).to.equal(500);

			const html1 = await response1.text();
			const html2 = await response2.text();
			const html3 = await response3.text();

			expect(html1).to.contain("Something went wrong");

			expect(html1).to.equal(html2);
			expect(html2).to.equal(html3);
		});

		it('includes expected styles in a redirected prerendered 500 route', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/fivehundred');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);
			
			// length will be 0 if the stylesheet does not get included
			expect($('link[rel=stylesheet]')).to.have.a.lengthOf(1);
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

	describe('New prerender option breaks catch-all route on root when using preview', () => {
		// bug id #6020
		it('fix bug id #6020', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/some');
			const response = await app.render(request);
			expect(response.status).to.equal(200);
			const html = await response.text();
			const $ = cheerio.load(html);
			expect($('p').text()).to.include('not give 404');
		});
	});
});

describe('Integrations can hook into the prerendering decision', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	const testIntegration = {
		name: 'test prerendering integration',
		hooks: {
			['astro:build:setup']({ pages, target }) {
				if (target !== 'client') return;
				// this page has `export const prerender = true`
				pages.get('src/pages/static.astro').route.prerender = false;

				// this page does not
				pages.get('src/pages/not-prerendered.astro').route.prerender = true;
			},
		},
	};

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-prerender/',
			output: 'server',
			integrations: [testIntegration],
			adapter: testAdapter(),
		});
		await fixture.build();
	});

	it('An integration can override the prerender flag', async () => {
		// test adapter only hosts dynamic routes
		// /static is expected to become dynamic
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/static');
		const response = await app.render(request);
		expect(response.status).to.equal(200);
	});

	it('An integration can turn a normal page to a prerendered one', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/not-prerendered');
		const response = await app.render(request);
		expect(response.status).to.equal(404);
	});
});
