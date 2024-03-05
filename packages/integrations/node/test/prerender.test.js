import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import nodejs from '../dist/index.js';
import { loadFixture, waitServerListen } from './test-utils.js';

/**
 * @typedef {import('../../../astro/test/test-utils').Fixture} Fixture
 */

async function load() {
	const mod = await import(`./fixtures/prerender/dist/server/entry.mjs?dropcache=${Date.now()}`);
	return mod;
}
describe('Prerendering', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let server;

	describe('With base', async () => {
		before(async () => {
			process.env.PRERENDER = true;

			fixture = await loadFixture({
				base: '/some-base',
				root: './fixtures/prerender/',
				output: 'server',
				adapter: nodejs({ mode: 'standalone' }),
			});
			await fixture.build();
			const { startServer } = await load();
			let res = startServer();
			server = res.server;
			await waitServerListen(server.server);
		});

		after(async () => {
			await server.stop();
			await fixture.clean();
			delete process.env.PRERENDER;
		});

		it('Can render SSR route', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/some-base/one`);
			const html = await res.text();
			const $ = cheerio.load(html);

			assert.equal(res.status, 200);
			assert.equal($('h1').text(), 'One');
		});

		it('Can render prerendered route', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/some-base/two`);
			const html = await res.text();
			const $ = cheerio.load(html);

			assert.equal(res.status, 200);
			assert.equal($('h1').text(), 'Two');
		});

		it('Can render prerendered route with redirect and query params', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/some-base/two?foo=bar`);
			const html = await res.text();
			const $ = cheerio.load(html);

			assert.equal(res.status, 200);
			assert.equal($('h1').text(), 'Two');
		});

		it('Can render prerendered route with query params', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/some-base/two/?foo=bar`);
			const html = await res.text();
			const $ = cheerio.load(html);

			assert.equal(res.status, 200);
			assert.equal($('h1').text(), 'Two');
		});

		it('Can render prerendered route without trailing slash', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/some-base/two`, {
				redirect: 'manual',
			});
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal(res.status, 200);
			assert.equal($('h1').text(), 'Two');
		});
	});

	describe('Without base', async () => {
		before(async () => {
			process.env.PRERENDER = true;

			fixture = await loadFixture({
				root: './fixtures/prerender/',
				output: 'server',
				adapter: nodejs({ mode: 'standalone' }),
			});
			await fixture.build();
			const { startServer } = await await load();
			let res = startServer();
			server = res.server;
			await waitServerListen(server.server);
		});

		after(async () => {
			await server.stop();
			await fixture.clean();
			delete process.env.PRERENDER;
		});

		it('Can render SSR route', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/one`);
			const html = await res.text();
			const $ = cheerio.load(html);

			assert.equal(res.status, 200);
			assert.equal($('h1').text(), 'One');
		});

		it('Can render prerendered route', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/two`);
			const html = await res.text();
			const $ = cheerio.load(html);

			assert.equal(res.status, 200);
			assert.equal($('h1').text(), 'Two');
		});

		it('Can render prerendered route with redirect and query params', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/two?foo=bar`);
			const html = await res.text();
			const $ = cheerio.load(html);

			assert.equal(res.status, 200);
			assert.equal($('h1').text(), 'Two');
		});

		it('Can render prerendered route with query params', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/two/?foo=bar`);
			const html = await res.text();
			const $ = cheerio.load(html);

			assert.equal(res.status, 200);
			assert.equal($('h1').text(), 'Two');
		});
	});

	describe('Dev', () => {
		let devServer;

		before(async () => {
			process.env.PRERENDER = true;

			fixture = await loadFixture({
				root: './fixtures/prerender/',
				output: 'server',
				adapter: nodejs({ mode: 'standalone' }),
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
			delete process.env.PRERENDER;
		});

		it('Can render SSR route', async () => {
			const res = await fixture.fetch(`/one`);
			const html = await res.text();
			const $ = cheerio.load(html);

			assert.equal(res.status, 200);
			assert.equal($('h1').text(), 'One');
		});

		it('Can render prerendered route', async () => {
			const res = await fixture.fetch(`/two`);
			const html = await res.text();
			const $ = cheerio.load(html);

			assert.equal(res.status, 200);
			assert.equal($('h1').text(), 'Two');
		});
	});
});

describe('Hybrid rendering', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let server;

	describe('With base', () => {
		before(async () => {
			process.env.PRERENDER = false;
			fixture = await loadFixture({
				base: '/some-base',
				root: './fixtures/prerender/',
				output: 'hybrid',
				adapter: nodejs({ mode: 'standalone' }),
			});
			await fixture.build();
			const { startServer } = await load();
			let res = startServer();
			server = res.server;
			await waitServerListen(server.server);
		});

		after(async () => {
			await server.stop();
			await fixture.clean();
			delete process.env.PRERENDER;
		});

		it('Can render SSR route', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/some-base/two`);
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal(res.status, 200);
			assert.equal($('h1').text(), 'Two');
		});

		it('Can render prerendered route', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/some-base/one`);
			const html = await res.text();
			const $ = cheerio.load(html);

			assert.equal(res.status, 200);
			assert.equal($('h1').text(), 'One');
		});

		it('Can render prerendered route with redirect and query params', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/some-base/one?foo=bar`);
			const html = await res.text();
			const $ = cheerio.load(html);

			assert.equal(res.status, 200);
			assert.equal($('h1').text(), 'One');
		});

		it('Can render prerendered route with query params', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/some-base/one/?foo=bar`);
			const html = await res.text();
			const $ = cheerio.load(html);

			assert.equal(res.status, 200);
			assert.equal($('h1').text(), 'One');
		});

		it('Can render prerendered route without trailing slash', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/some-base/one`, {
				redirect: 'manual',
			});
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal(res.status, 200);
			assert.equal($('h1').text(), 'One');
		});
	});

	describe('Without base', () => {
		before(async () => {
			process.env.PRERENDER = false;
			fixture = await loadFixture({
				root: './fixtures/prerender/',
				output: 'hybrid',
				adapter: nodejs({ mode: 'standalone' }),
			});
			await fixture.build();
			const { startServer } = await load();
			let res = startServer();
			server = res.server;
			await waitServerListen(server.server);
		});

		after(async () => {
			await server.stop();
			await fixture.clean();
			delete process.env.PRERENDER;
		});

		it('Can render SSR route', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/two`);
			const html = await res.text();
			const $ = cheerio.load(html);

			assert.equal(res.status, 200);
			assert.equal($('h1').text(), 'Two');
		});

		it('Can render prerendered route', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/one`);
			const html = await res.text();
			const $ = cheerio.load(html);

			assert.equal(res.status, 200);
			assert.equal($('h1').text(), 'One');
		});

		it('Can render prerendered route with redirect and query params', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/one?foo=bar`);
			const html = await res.text();
			const $ = cheerio.load(html);

			assert.equal(res.status, 200);
			assert.equal($('h1').text(), 'One');
		});

		it('Can render prerendered route with query params', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/one/?foo=bar`);
			const html = await res.text();
			const $ = cheerio.load(html);

			assert.equal(res.status, 200);
			assert.equal($('h1').text(), 'One');
		});
	});

	describe('Shared modules', () => {
		before(async () => {
			process.env.PRERENDER = false;

			fixture = await loadFixture({
				root: './fixtures/prerender/',
				output: 'hybrid',
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

		it('Can render SSR route', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/third`);
			const html = await res.text();
			const $ = cheerio.load(html);

			assert.equal(res.status, 200);
			assert.equal($('h1').text(), 'shared');
		});
	});
});
