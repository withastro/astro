import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('Dev reroute', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/reroute/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('should render the index page when navigating /reroute ', async () => {
		const html = await fixture.fetch('/reroute').then((res) => res.text());
		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Index');
	});

	it('should render the index page when navigating /blog/hello ', async () => {
		const html = await fixture.fetch('/blog/hello').then((res) => res.text());
		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Index');
	});

	it('should render the index page when navigating /blog/salut ', async () => {
		const html = await fixture.fetch('/blog/salut').then((res) => res.text());
		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Index');
	});

	it('should render the index page when navigating dynamic route /dynamic/[id] ', async () => {
		const html = await fixture.fetch('/dynamic/hello').then((res) => res.text());
		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Index');
	});

	it('should render the index page when navigating spread route /spread/[...spread] ', async () => {
		const html = await fixture.fetch('/spread/hello').then((res) => res.text());
		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Index');
	});

	it('should render the 404 built-in page', async () => {
		const html = await fixture.fetch('/blog/oops').then((res) => res.text());
		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), '404:  Not found');
	});
});

describe('Build reroute', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/reroute/',
		});
		await fixture.build();
	});

	it('should render the index page when navigating /reroute ', async () => {
		const html = await fixture.readFile('/reroute/index.html');
		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Index');
	});

	it('should render the index page when navigating /blog/hello ', async () => {
		const html = await fixture.readFile('/blog/hello/index.html');
		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Index');
	});

	it('should render the index page when navigating /blog/salut ', async () => {
		const html = await fixture.readFile('/blog/salut/index.html');

		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Index');
	});

	it('should render the index page when navigating dynamic route /dynamic/[id] ', async () => {
		const html = await fixture.readFile('/dynamic/hello/index.html');
		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Index');
	});

	it('should render the index page when navigating spread route /spread/[...spread] ', async () => {
		const html = await fixture.readFile('/spread/hello/index.html');
		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Index');
	});

	it('should render the 404 built-in page', async () => {
		try {
			const html = await fixture.readFile('/spread/oops/index.html');
			assert.fail('Not found');
		} catch {
			assert.ok;
		}
	});
});

describe('SSR reroute', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let app;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/reroute/',
			output: 'server',
			adapter: testAdapter(),
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	it('should render the index page when navigating /reroute ', async () => {
		const request = new Request('http://example.com/reroute');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Index');
	});

	it('should render the index page when navigating /blog/hello ', async () => {
		const request = new Request('http://example.com/blog/hello');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Index');
	});

	it('should render the index page when navigating /blog/salut ', async () => {
		const request = new Request('http://example.com/blog/salut');
		const response = await app.render(request);
		const html = await response.text();

		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Index');
	});

	it('should render the index page when navigating dynamic route /dynamic/[id] ', async () => {
		const request = new Request('http://example.com/dynamic/hello');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Index');
	});

	it('should render the index page when navigating spread route /spread/[...spread] ', async () => {
		const request = new Request('http://example.com/spread/hello');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Index');
	});

	it('should render the 404 built-in page', async () => {
		const request = new Request('http://example.com/blog/oops');
		const response = await app.render(request);
		const html = await response.text();
		assert.equal(html, 'Not found');
	});
});

describe('Middleware', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/reroute/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('should render a locals populated in the third middleware function, because we use next("/")', async () => {
		const html = await fixture.fetch('/auth/base').then((res) => res.text());
		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Index');
		assert.equal($('p').text(), 'Called auth');
	});

	it('should NOT render locals populated in the third middleware function, because we use ctx.reroute("/")', async () => {
		const html = await fixture.fetch('/auth/dashboard').then((res) => res.text());
		const $ = cheerioLoad(html);

		assert.equal($('h1').text(), 'Index');
		assert.equal($('p').text(), '');
	});

	it('should render the index when rewriting with params', async () => {
		const html = await fixture.fetch('/auth/params').then((res) => res.text());
		const $ = cheerioLoad(html);

		assert.match($('h1').text(), /Index/);
	});
});
