import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';
import * as cheerio from 'cheerio';

describe('404 and 500 pages', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-api-route-custom-404/',
			output: 'server',
			adapter: testAdapter(),
			// test suite was authored when inlineStylesheets defaulted to never
			build: { inlineStylesheets: 'never' },
		});
	});

	describe('Development', () => {
		/** @type {import('./test-utils').DevServer} */
		let devServer;
		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Returns 404 when hitting an API route with the wrong method', async () => {
			let res = await fixture.fetch('/api/route', {
				method: 'PUT',
			});
			let html = await res.text();
			let $ = cheerio.load(html);
			expect($('h1').text()).to.equal(`Something went horribly wrong!`);
		});
	});

	describe('Production', () => {
		before(async () => {
			await fixture.build({});
		});

		it('404 page returned when a route does not match', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/some/fake/route');
			const response = await app.render(request);
			expect(response.status).to.equal(404);
			const html = await response.text();
			const $ = cheerio.load(html);
			expect($('h1').text()).to.equal('Something went horribly wrong!');
		});

		it('404 page returned when a route does not match and passing routeData', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/some/fake/route');
			const routeData = app.match(request, { matchNotFound: true });
			const response = await app.render(request, routeData);
			expect(response.status).to.equal(404);
			const html = await response.text();
			const $ = cheerio.load(html);
			expect($('h1').text()).to.equal('Something went horribly wrong!');
		});

		it('404 page returned when a route does not match and imports are included', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/blog/fake/route');
			const routeData = app.match(request);
			const response = await app.render(request, routeData);
			expect(response.status).to.equal(404);
			const html = await response.text();
			const $ = cheerio.load(html);
			expect($('head link')).to.have.a.lengthOf(1);
		});

		it('404 page returned when there is an 404 response returned from route', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/causes-404');
			const response = await app.render(request);
			expect(response.status).to.equal(404);
			const html = await response.text();
			const $ = cheerio.load(html);
			expect($('h1').text()).to.equal('Something went horribly wrong!');
		});

		it('500 page returned when there is an error', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/causes-error');
			const response = await app.render(request);
			expect(response.status).to.equal(500);
			const html = await response.text();
			const $ = cheerio.load(html);
			expect($('h1').text()).to.equal('This is an error page');
		});

		it('Returns 404 when hitting an API route with the wrong method', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/api/route', {
				method: 'PUT',
			});
			const response = await app.render(request);
			expect(response.status).to.equal(404);
			const html = await response.text();
			const $ = cheerio.load(html);
			expect($('h1').text()).to.equal(`Something went horribly wrong!`);
		});
	});
});
