import { expect } from 'chai';
import * as cheerio from 'cheerio';
import nodejs from '../dist/index.js';
import { loadFixture } from './test-utils.js';

/**
 * @typedef {import('../../../astro/test/test-utils').Fixture} Fixture
 */

async function load() {
	const mod = await import(
		`./fixtures/trailing-slash/dist/server/entry.mjs?dropcache=${Date.now()}`
	);
	return mod;
}

describe('Trailing slash', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let server;
	describe('Always', async () => {
		describe('With base', async () => {
			before(async () => {
				process.env.ASTRO_NODE_AUTOSTART = 'disabled';
				process.env.PRERENDER = true;

				fixture = await loadFixture({
					root: './fixtures/trailing-slash/',
					base: '/some-base',
					output: 'hybrid',
					trailingSlash: 'always',
					adapter: nodejs({ mode: 'standalone' }),
				});
				await fixture.build();
				const { startServer } = await load();
				let res = startServer();
				server = res.server;
			});

			after(async () => {
				await server.stop();
				await fixture.clean();
				delete process.env.PRERENDER;
			});

			it('Can render prerendered base route', async () => {
				const res = await fetch(`http://${server.host}:${server.port}`);
				const html = await res.text();
				const $ = cheerio.load(html);

				expect(res.status).to.equal(200);
				expect($('h1').text()).to.equal('Index');
			});

			it('Can render prerendered route with redirect', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/some-base/one`, {
					redirect: 'manual',
				});
				expect(res.status).to.equal(301);
				expect(res.headers.get('location')).to.equal('/some-base/one/');
			});

			it('Can render prerendered route with redirect and query params', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/some-base/one?foo=bar`, {
					redirect: 'manual',
				});
				expect(res.status).to.equal(301);
				expect(res.headers.get('location')).to.equal('/some-base/one/?foo=bar');
			});

			it('Can render prerendered route with query params', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/some-base/one/?foo=bar`);
				const html = await res.text();
				const $ = cheerio.load(html);

				expect(res.status).to.equal(200);
				expect($('h1').text()).to.equal('One');
			});
		});
		describe('Without base', async () => {
			before(async () => {
				process.env.ASTRO_NODE_AUTOSTART = 'disabled';
				process.env.PRERENDER = true;

				fixture = await loadFixture({
					root: './fixtures/trailing-slash/',
					output: 'hybrid',
					trailingSlash: 'always',
					adapter: nodejs({ mode: 'standalone' }),
				});
				await fixture.build();
				const { startServer } = await load();
				let res = startServer();
				server = res.server;
			});

			after(async () => {
				await server.stop();
				await fixture.clean();
				delete process.env.PRERENDER;
			});

			it('Can render prerendered base route', async () => {
				const res = await fetch(`http://${server.host}:${server.port}`);
				const html = await res.text();
				const $ = cheerio.load(html);

				expect(res.status).to.equal(200);
				expect($('h1').text()).to.equal('Index');
			});

			it('Can render prerendered route with redirect', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/one`, {
					redirect: 'manual',
				});
				expect(res.status).to.equal(301);
				expect(res.headers.get('location')).to.equal('/one/');
			});

			it('Can render prerendered route with redirect and query params', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/one?foo=bar`, {
					redirect: 'manual',
				});
				expect(res.status).to.equal(301);
				expect(res.headers.get('location')).to.equal('/one/?foo=bar');
			});

			it('Can render prerendered route with query params', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/one/?foo=bar`);
				const html = await res.text();
				const $ = cheerio.load(html);

				expect(res.status).to.equal(200);
				expect($('h1').text()).to.equal('One');
			});
		});
	});
	describe('Never', async () => {
		describe('With base', async () => {
			before(async () => {
				process.env.ASTRO_NODE_AUTOSTART = 'disabled';
				process.env.PRERENDER = true;

				fixture = await loadFixture({
					root: './fixtures/trailing-slash/',
					base: '/some-base',
					output: 'hybrid',
					trailingSlash: 'never',
					adapter: nodejs({ mode: 'standalone' }),
				});
				await fixture.build();
				const { startServer } = await load();
				let res = startServer();
				server = res.server;
			});

			after(async () => {
				await server.stop();
				await fixture.clean();
				delete process.env.PRERENDER;
			});

			it('Can render prerendered base route', async () => {
				const res = await fetch(`http://${server.host}:${server.port}`);
				const html = await res.text();
				const $ = cheerio.load(html);

				expect(res.status).to.equal(200);
				expect($('h1').text()).to.equal('Index');
			});

			it('Can render prerendered route with redirect', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/some-base/one/`, {
					redirect: 'manual',
				});
				expect(res.status).to.equal(301);
				expect(res.headers.get('location')).to.equal('/some-base/one');
			});

			it('Can render prerendered route with redirect and query params', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/some-base/one/?foo=bar`, {
					redirect: 'manual',
				});

				expect(res.status).to.equal(301);
				expect(res.headers.get('location')).to.equal('/some-base/one?foo=bar');
			});

			it('Can render prerendered route with query params', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/some-base/one?foo=bar`);
				const html = await res.text();
				const $ = cheerio.load(html);

				expect(res.status).to.equal(200);
				expect($('h1').text()).to.equal('One');
			});
		});
		describe('Without base', async () => {
			before(async () => {
				process.env.ASTRO_NODE_AUTOSTART = 'disabled';
				process.env.PRERENDER = true;

				fixture = await loadFixture({
					root: './fixtures/trailing-slash/',
					output: 'hybrid',
					trailingSlash: 'never',
					adapter: nodejs({ mode: 'standalone' }),
				});
				await fixture.build();
				const { startServer } = await load();
				let res = startServer();
				server = res.server;
			});

			after(async () => {
				await server.stop();
				await fixture.clean();
				delete process.env.PRERENDER;
			});

			it('Can render prerendered base route', async () => {
				const res = await fetch(`http://${server.host}:${server.port}`);
				const html = await res.text();
				const $ = cheerio.load(html);

				expect(res.status).to.equal(200);
				expect($('h1').text()).to.equal('Index');
			});

			it('Can render prerendered route with redirect', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/one/`, {
					redirect: 'manual',
				});
				expect(res.status).to.equal(301);
				expect(res.headers.get('location')).to.equal('/one');
			});

			it('Can render prerendered route with redirect and query params', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/one/?foo=bar`, {
					redirect: 'manual',
				});

				expect(res.status).to.equal(301);
				expect(res.headers.get('location')).to.equal('/one?foo=bar');
			});

			it('Can render prerendered route and query params', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/one?foo=bar`);
				const html = await res.text();
				const $ = cheerio.load(html);

				expect(res.status).to.equal(200);
				expect($('h1').text()).to.equal('One');
			});
		});
	});
	describe('Ignore', async () => {
		describe('With base', async () => {
			before(async () => {
				process.env.ASTRO_NODE_AUTOSTART = 'disabled';
				process.env.PRERENDER = true;

				fixture = await loadFixture({
					root: './fixtures/trailing-slash/',
					base: '/some-base',
					output: 'hybrid',
					trailingSlash: 'ignore',
					adapter: nodejs({ mode: 'standalone' }),
				});
				await fixture.build();
				const { startServer } = await load();
				let res = startServer();
				server = res.server;
			});

			after(async () => {
				await server.stop();
				await fixture.clean();
				delete process.env.PRERENDER;
			});

			it('Can render prerendered base route', async () => {
				const res = await fetch(`http://${server.host}:${server.port}`);
				const html = await res.text();
				const $ = cheerio.load(html);

				expect(res.status).to.equal(200);
				expect($('h1').text()).to.equal('Index');
			});

			it('Can render prerendered route with slash', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/some-base/one/`, {
					redirect: 'manual',
				});
				const html = await res.text();
				const $ = cheerio.load(html);

				expect(res.status).to.equal(200);
				expect($('h1').text()).to.equal('One');
			});

			it('Can render prerendered route without slash', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/some-base/one`, {
					redirect: 'manual',
				});
				const html = await res.text();
				const $ = cheerio.load(html);

				expect(res.status).to.equal(200);
				expect($('h1').text()).to.equal('One');
			});

			it('Can render prerendered route with slash and query params', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/some-base/one/?foo=bar`, {
					redirect: 'manual',
				});
				const html = await res.text();
				const $ = cheerio.load(html);

				expect(res.status).to.equal(200);
				expect($('h1').text()).to.equal('One');
			});

			it('Can render prerendered route without slash and with query params', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/some-base/one?foo=bar`, {
					redirect: 'manual',
				});
				const html = await res.text();
				const $ = cheerio.load(html);

				expect(res.status).to.equal(200);
				expect($('h1').text()).to.equal('One');
			});
		});
		describe('Without base', async () => {
			before(async () => {
				process.env.ASTRO_NODE_AUTOSTART = 'disabled';
				process.env.PRERENDER = true;

				fixture = await loadFixture({
					root: './fixtures/trailing-slash/',
					output: 'hybrid',
					trailingSlash: 'ignore',
					adapter: nodejs({ mode: 'standalone' }),
				});
				await fixture.build();
				const { startServer } = await load();
				let res = startServer();
				server = res.server;
			});

			after(async () => {
				await server.stop();
				await fixture.clean();
				delete process.env.PRERENDER;
			});

			it('Can render prerendered base route', async () => {
				const res = await fetch(`http://${server.host}:${server.port}`);
				const html = await res.text();
				const $ = cheerio.load(html);

				expect(res.status).to.equal(200);
				expect($('h1').text()).to.equal('Index');
			});

			it('Can render prerendered route with slash', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/one/`);
				const html = await res.text();
				const $ = cheerio.load(html);

				expect(res.status).to.equal(200);
				expect($('h1').text()).to.equal('One');
			});

			it('Can render prerendered route without slash', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/one`);
				const html = await res.text();
				const $ = cheerio.load(html);

				expect(res.status).to.equal(200);
				expect($('h1').text()).to.equal('One');
			});

			it('Can render prerendered route with slash and query params', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/one/?foo=bar`, {
					redirect: 'manual',
				});
				const html = await res.text();
				const $ = cheerio.load(html);

				expect(res.status).to.equal(200);
				expect($('h1').text()).to.equal('One');
			});

			it('Can render prerendered route without slash and with query params', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/one?foo=bar`);
				const html = await res.text();
				const $ = cheerio.load(html);

				expect(res.status).to.equal(200);
				expect($('h1').text()).to.equal('One');
			});
		});
	});
});
