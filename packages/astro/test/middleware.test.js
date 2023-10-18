import { loadFixture } from './test-utils.js';
import { expect } from 'chai';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.js';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';

describe('Middleware in DEV mode', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware space/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('should render locals data', async () => {
		const html = await fixture.fetch('/').then((res) => res.text());
		const $ = cheerio.load(html);
		expect($('p').html()).to.equal('bar');
	});

	it('should change locals data based on URL', async () => {
		let html = await fixture.fetch('/').then((res) => res.text());
		let $ = cheerio.load(html);
		expect($('p').html()).to.equal('bar');

		html = await fixture.fetch('/lorem').then((res) => res.text());
		$ = cheerio.load(html);
		expect($('p').html()).to.equal('ipsum');
	});

	it('should call a second middleware', async () => {
		let html = await fixture.fetch('/second').then((res) => res.text());
		let $ = cheerio.load(html);
		expect($('p').html()).to.equal('second');
	});

	it('should successfully create a new response', async () => {
		let html = await fixture.fetch('/rewrite').then((res) => res.text());
		let $ = cheerio.load(html);
		expect($('p').html()).to.be.null;
		expect($('span').html()).to.equal('New content!!');
	});

	it('should return a new response that is a 500', async () => {
		await fixture.fetch('/broken-500').then((res) => {
			expect(res.status).to.equal(500);
			return res.text();
		});
	});

	it('should successfully render a page if the middleware calls only next() and returns nothing', async () => {
		let html = await fixture.fetch('/not-interested').then((res) => res.text());
		let $ = cheerio.load(html);
		expect($('p').html()).to.equal('Not interested');
	});

	it("should throw an error when the middleware doesn't call next or doesn't return a response", async () => {
		let html = await fixture.fetch('/does-nothing').then((res) => res.text());
		let $ = cheerio.load(html);
		expect($('title').html()).to.equal('MiddlewareNoDataOrNextCalled');
	});

	it('should allow setting cookies', async () => {
		let res = await fixture.fetch('/');
		expect(res.headers.get('set-cookie')).to.equal('foo=bar');
	});

	it('should be able to clone the response', async () => {
		let res = await fixture.fetch('/clone');
		let html = await res.text();
		expect(html).to.contain('<h1>it works</h1>');
	});

	it('should forward cookies set in a component when the middleware returns a new response', async () => {
		let res = await fixture.fetch('/return-response-cookies');
		let headers = res.headers;
		expect(headers.get('set-cookie')).to.not.equal(null);
	});
});

describe('Middleware in PROD mode, SSG', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware-ssg/',
		});
		await fixture.build();
	});

	it('should render locals data', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		expect($('p').html()).to.equal('bar');
	});

	it('should change locals data based on URL', async () => {
		let html = await fixture.readFile('/index.html');
		let $ = cheerio.load(html);
		expect($('p').html()).to.equal('bar');

		html = await fixture.readFile('/second/index.html');
		$ = cheerio.load(html);
		expect($('p').html()).to.equal('second');
	});
});

describe('Middleware API in PROD mode, SSR', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let middlewarePath;
	/** @type {import('../src/core/app/index').App} */
	let app;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware space/',
			output: 'server',
			adapter: testAdapter({}),
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	it('should render locals data', async () => {
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerio.load(html);
		expect($('p').html()).to.equal('bar');
	});

	it('should change locals data based on URL', async () => {
		let response = await app.render(new Request('http://example.com/'));
		let html = await response.text();
		let $ = cheerio.load(html);
		expect($('p').html()).to.equal('bar');

		response = await app.render(new Request('http://example.com/lorem'));
		html = await response.text();
		$ = cheerio.load(html);
		expect($('p').html()).to.equal('ipsum');
	});

	it('should successfully redirect to another page', async () => {
		const request = new Request('http://example.com/redirect');
		const response = await app.render(request);
		expect(response.status).to.equal(302);
	});

	it('should call a second middleware', async () => {
		const response = await app.render(new Request('http://example.com/second'));
		const html = await response.text();
		const $ = cheerio.load(html);
		expect($('p').html()).to.equal('second');
	});

	it('should successfully create a new response', async () => {
		const request = new Request('http://example.com/rewrite');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerio.load(html);
		expect($('p').html()).to.be.null;
		expect($('span').html()).to.equal('New content!!');
	});

	it('should return a new response that is a 500', async () => {
		const request = new Request('http://example.com/broken-500');
		const response = await app.render(request);
		expect(response.status).to.equal(500);
	});

	it('should successfully render a page if the middleware calls only next() and returns nothing', async () => {
		const request = new Request('http://example.com/not-interested');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerio.load(html);
		expect($('p').html()).to.equal('Not interested');
	});

	it("should throw an error when the middleware doesn't call next or doesn't return a response", async () => {
		const request = new Request('http://example.com/does-nothing');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerio.load(html);
		expect($('title').html()).to.not.equal('MiddlewareNoDataReturned');
	});

	it('should correctly work for API endpoints that return a Response object', async () => {
		const request = new Request('http://example.com/api/endpoint');
		const response = await app.render(request);
		expect(response.status).to.equal(200);
		expect(response.headers.get('Content-Type')).to.equal('application/json');
	});

	it('should correctly manipulate the response coming from API endpoints (not simple)', async () => {
		const request = new Request('http://example.com/api/endpoint');
		const response = await app.render(request);
		const text = await response.text();
		expect(text.includes('REDACTED')).to.be.true;
	});

	it('should correctly call the middleware function for 404', async () => {
		const request = new Request('http://example.com/funky-url');
		const routeData = app.match(request, { matchNotFound: true });
		const response = await app.render(request, routeData);
		const text = await response.text();
		expect(text.includes('Error')).to.be.true;
		expect(text.includes('bar')).to.be.true;
	});

	it('should render 500.astro when the middleware throws an error', async () => {
		const request = new Request('http://example.com/throw');
		const routeData = app.match(request, { matchNotFound: true });
		
		const response = await app.render(request, routeData);
		expect(response).to.deep.include({ status: 500 });

		const text = await response.text();
		expect(text).to.include("<h1>There was an error rendering the page.</h1>")
	});

	it('the integration should receive the path to the middleware', async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware space/',
			output: 'server',
			build: {
				excludeMiddleware: true,
			},
			adapter: testAdapter({
				setMiddlewareEntryPoint(entryPointsOrMiddleware) {
					middlewarePath = entryPointsOrMiddleware;
				},
			}),
		});
		await fixture.build();
		expect(middlewarePath).to.not.be.undefined;
		try {
			const path = fileURLToPath(middlewarePath);
			expect(existsSync(path)).to.be.true;
			const content = readFileSync(fileURLToPath(middlewarePath), 'utf-8');
			expect(content.length).to.be.greaterThan(0);
		} catch (e) {
			throw e;
		}
	});
});

describe('Middleware with tailwind', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware-tailwind/',
		});
		await fixture.build();
	});

	it('should correctly emit the tailwind CSS file', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const bundledCSSHREF = $('link[rel=stylesheet][href^=/_astro/]').attr('href');
		const bundledCSS = (await fixture.readFile(bundledCSSHREF.replace(/^\/?/, '/')))
			.replace(/\s/g, '')
			.replace('/n', '');
		expect(bundledCSS.includes('--tw-content')).to.be.true;
	});
});

describe('Middleware, split middleware option', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware space/',
			output: 'server',
			build: {
				excludeMiddleware: true,
			},
			adapter: testAdapter({}),
		});
		await fixture.build();
	});

	it('should not render locals data because the page does not export it', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerio.load(html);
		expect($('p').html()).to.not.equal('bar');
	});
});
