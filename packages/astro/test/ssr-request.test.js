import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';

describe('Using Astro.request in SSR', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-request/',
			adapter: testAdapter(),
			output: 'server',
			base: '/subpath/',
			integrations: [
				{
					name: 'inject-script',
					hooks: {
						'astro:config:setup'({ injectScript }) {
							injectScript('page', 'import "/src/scripts/inject-script.js";');
						},
					},
				},
			],
			vite: {
				build: {
					assetsInlineLimit: 0,
				},
			},
		});
		await fixture.build();
	});

	it('Gets the request passed in', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/subpath/request');
		const response = await app.render(request);
		expect(response.status).to.equal(200);
		const html = await response.text();
		const $ = cheerioLoad(html);
		expect($('#origin').text()).to.equal('http://example.com');
	});

	it('Duplicate slashes are collapsed', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/subpath////request/////');
		const response = await app.render(request);
		expect(response.status).to.equal(200);
		const html = await response.text();
		const $ = cheerioLoad(html);
		expect($('#origin').text()).to.equal('http://example.com');
		expect($('#pathname').text()).to.equal('/subpath/request/');
		expect($('#request-pathname').text()).to.equal('/subpath/request/');
	});

	it('public file is copied over', async () => {
		const json = await fixture.readFile('/client/cars.json');
		expect(json).to.not.be.undefined;
	});

	it('CSS assets have their base prefix', async () => {
		const app = await fixture.loadTestAdapterApp();
		let request = new Request('http://example.com/subpath/request');
		let response = await app.render(request);
		expect(response.status).to.equal(200);
		const html = await response.text();
		const $ = cheerioLoad(html);

		const linkHref = $('link').attr('href');
		expect(linkHref.startsWith('/subpath/')).to.equal(true);

		request = new Request('http://example.com' + linkHref);
		response = await app.render(request);

		expect(response.status).to.equal(200);
		const css = await response.text();
		expect(css).to.not.be.an('undefined');
	});

	it('script assets have their base prefix', async () => {
		const app = await fixture.loadTestAdapterApp();
		let request = new Request('http://example.com/subpath/request');
		let response = await app.render(request);
		expect(response.status).to.equal(200);
		const html = await response.text();
		const $ = cheerioLoad(html);

		for (const el of $('script')) {
			const scriptSrc = $(el).attr('src');
			expect(scriptSrc.startsWith('/subpath/')).to.equal(true);

			request = new Request('http://example.com' + scriptSrc);
			response = await app.render(request);

			expect(response.status).to.equal(200);
			const js = await response.text();
			expect(js).to.not.be.an('undefined');
		}
	});

	it('assets can be fetched', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/subpath/cars.json');
		const response = await app.render(request);
		expect(response.status).to.equal(200);
		const data = await response.json();
		expect(data).to.be.an('array');
	});
});
