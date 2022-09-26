import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';

describe('Astro.cookies', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-cookies/',
			output: 'server',
			adapter: testAdapter(),
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

		it('is able to get cookies from the request', async () => {
			const response = await fixture.fetch('/get-json', {
				headers: {
					cookie: `prefs=${encodeURIComponent(JSON.stringify({ mode: 'light' }))}`
				}
			});
			expect(response.status).to.equal(200);
			const html = await response.text();
	
			const $ = cheerio.load(html);
			expect($('dd').text()).to.equal('light');
		});
	
		it('can set the cookie value', async () => {
			const response = await fixture.fetch('/set-value', {
				method: 'POST'
			});
			expect(response.status).to.equal(200);
			expect(response.headers.has('set-cookie')).to.equal(true);
		});
	});

	describe('Production', () => {
		let app;
		before(async () => {
			await fixture.build();
			app = await fixture.loadTestAdapterApp();
		});

		async function fetchResponse(path, requestInit) {
			const request = new Request('http://example.com' + path, requestInit);
			const response = await app.render(request);
			return response;
		}
	
		it('is able to get cookies from the request', async () => {
			const response = await fetchResponse('/get-json', {
				headers: {
					cookie: `prefs=${encodeURIComponent(JSON.stringify({ mode: 'light' }))}`
				}
			});
			expect(response.status).to.equal(200);
			const html = await response.text();
	
			const $ = cheerio.load(html);
			expect($('dd').text()).to.equal('light');
		});
	
		it('can set the cookie value', async () => {
			const response = await fetchResponse('/set-value', {
				method: 'POST'
			});
			expect(response.status).to.equal(200);
			let headers = Array.from(app.setCookieHeaders(response));
			expect(headers).to.have.a.lengthOf(1);
			expect(headers[0]).to.match(/Expires/);
		});
	
		it('Early returning a Response still includes set headers', async () => {
			const response = await fetchResponse('/early-return', {
				headers: {
					cookie: `prefs=${encodeURIComponent(JSON.stringify({ mode: 'light' }))}`
				}
			});
			expect(response.status).to.equal(302);
			let headers = Array.from(app.setCookieHeaders(response));
			expect(headers).to.have.a.lengthOf(1);
			let raw = headers[0].slice(6);
			let data = JSON.parse(decodeURIComponent(raw));
			expect(data).to.be.an('object');
			expect(data.mode).to.equal('dark');
		});
		
		it('API route can get and set cookies', async () => {
			const response = await fetchResponse('/set-prefs', {
				method: 'POST',
				headers: {
					cookie: `prefs=${encodeURIComponent(JSON.stringify({ mode: 'light' }))}`
				}
			});
			expect(response.status).to.equal(302);
			let headers = Array.from(app.setCookieHeaders(response));
			expect(headers).to.have.a.lengthOf(1);
			let raw = headers[0].slice(6);
			let data = JSON.parse(decodeURIComponent(raw));
			expect(data).to.be.an('object');
			expect(data.mode).to.equal('dark');
		});
	})
});
