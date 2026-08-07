import * as assert from 'node:assert/strict';
import net from 'node:net';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import nodejs from '../dist/index.js';
import { type Fixture, loadFixture, waitServerListen, type AdapterServer } from './test-utils.ts';

/**
 * Sends a raw HTTP/1.1 request so the exact request-target (including
 * characters like `\` that URL parsers would otherwise normalize) reaches
 * the server unchanged, mirroring `curl --path-as-is`.
 */
function rawRequest(
	host: string,
	port: number,
	requestTarget: string,
): Promise<{ statusLine: string; head: string }> {
	return new Promise((resolve, reject) => {
		const socket = net.connect(port, host, () => {
			socket.write(
				`GET ${requestTarget} HTTP/1.1\r\nHost: ${host}:${port}\r\nConnection: close\r\n\r\n`,
			);
		});
		let data = '';
		socket.setEncoding('utf8');
		socket.on('data', (chunk) => {
			data += chunk;
		});
		socket.on('error', reject);
		socket.on('end', () => {
			const head = data.split('\r\n\r\n')[0] ?? '';
			const statusLine = head.split('\r\n')[0] ?? '';
			resolve({ statusLine, head });
		});
	});
}

describe('Trailing slash', () => {
	let fixture: Fixture;
	let server: AdapterServer;
	describe('Always', async () => {
		describe('With base', async () => {
			before(async () => {
				process.env.ASTRO_NODE_AUTOSTART = 'disabled';

				fixture = await loadFixture({
					root: './fixtures/trailing-slash/',
					base: '/some-base',
					output: 'static',
					trailingSlash: 'always',
					outDir: './dist/always-with-base',
					adapter: nodejs({ mode: 'standalone' }),
				});
				await fixture.build();
				const { startServer } = await fixture.loadAdapterEntryModule();
				const res = startServer();
				server = res.server;
				await waitServerListen(server.server);
			});

			after(async () => {
				await server.stop();
				await fixture.clean();
			});

			it('Can render prerendered base route', async () => {
				const res = await fetch(`http://${server.host}:${server.port}`);
				const html = await res.text();
				const $ = cheerio.load(html);

				assert.equal(res.status, 200);
				assert.equal($('h1').text(), 'Index');
			});

			it('Can render prerendered route with redirect', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/some-base/one`, {
					redirect: 'manual',
				});
				assert.equal(res.status, 301);
				assert.equal(res.headers.get('location'), '/some-base/one/');
			});

			it('Can render prerendered route with redirect and query params', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/some-base/one?foo=bar`, {
					redirect: 'manual',
				});
				assert.equal(res.status, 301);
				assert.equal(res.headers.get('location'), '/some-base/one/?foo=bar');
			});

			it('Can render prerendered route with query params', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/some-base/one/?foo=bar`);
				const html = await res.text();
				const $ = cheerio.load(html);

				assert.equal(res.status, 200);
				assert.equal($('h1').text(), 'One');
			});

			it('Does not add trailing slash to subresource urls', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/some-base/one.css`);
				const css = await res.text();

				assert.equal(res.status, 200);
				assert.equal(css, 'h1 { color: red; }\n');
			});

			it('Does not redirect requests for static assets with unusual filenames', async () => {
				const res = await fetch(
					`http://${server.host}:${server.port}/some-base/_astro/bitgeneva12.NY2V_gnX.woff2`,
					{
						redirect: 'manual',
					},
				);

				assert.equal(res.status, 200);
			});
		});
		describe('Without base', async () => {
			before(async () => {
				process.env.ASTRO_NODE_AUTOSTART = 'disabled';

				fixture = await loadFixture({
					root: './fixtures/trailing-slash/',
					output: 'static',
					trailingSlash: 'always',
					outDir: './dist/always-without-base',
					adapter: nodejs({ mode: 'standalone' }),
				});
				await fixture.build();
				const { startServer } = await fixture.loadAdapterEntryModule();
				const res = startServer();
				server = res.server;
				await waitServerListen(server.server);
			});

			after(async () => {
				await server.stop();
				await fixture.clean();
			});

			it('Can render prerendered base route', async () => {
				const res = await fetch(`http://${server.host}:${server.port}`);
				const html = await res.text();
				const $ = cheerio.load(html);

				assert.equal(res.status, 200);
				assert.equal($('h1').text(), 'Index');
			});

			it('Can render prerendered route with redirect', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/one`, {
					redirect: 'manual',
				});
				assert.equal(res.status, 301);
				assert.equal(res.headers.get('location'), '/one/');
			});

			it('Can render prerendered route with redirect and query params', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/one?foo=bar`, {
					redirect: 'manual',
				});
				assert.equal(res.status, 301);
				assert.equal(res.headers.get('location'), '/one/?foo=bar');
			});

			it('Can render prerendered route with query params', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/one/?foo=bar`);
				const html = await res.text();
				const $ = cheerio.load(html);

				assert.equal(res.status, 200);
				assert.equal($('h1').text(), 'One');
			});

			it('Does not add trailing slash to subresource urls', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/one.css`, {
					redirect: 'manual',
				});
				const css = await res.text();

				assert.equal(res.status, 200);
				assert.equal(css, 'h1 { color: red; }\n');
			});

			it('Does not redirect requests for static assets with unusual filenames', async () => {
				const res = await fetch(
					`http://${server.host}:${server.port}/_astro/bitgeneva12.NY2V_gnX.woff2`,
					{
						redirect: 'manual',
					},
				);

				assert.equal(res.status, 200);
			});
		});

		describe('Without automatic output', () => {
			before(async () => {
				process.env.ASTRO_NODE_AUTOSTART = 'disabled';

				fixture = await loadFixture({
					root: './fixtures/trailing-slash/',
					trailingSlash: 'always',
					adapter: nodejs({ mode: 'standalone' }),
				});
				await fixture.build();
				const { startServer } = await fixture.loadAdapterEntryModule();
				const res = startServer();
				server = res.server;
				await waitServerListen(server.server);
			});

			after(async () => {
				await server.stop();
				await fixture.clean();
			});

			it('Should return 404 when trying to serve a page with an internal path added to the URL', async () => {
				let res = await fetch(`http://${server.host}:${server.port}//astro.build/press`);
				assert.equal(res.status, 404);
				res = await fetch(`http://${server.host}:${server.port}/foo//astro.build/press`);
				assert.equal(res.status, 404);
				res = await fetch(`http://${server.host}:${server.port}//example.com/es//astro.build`);
				assert.equal(res.status, 404);
				res = await fetch(
					`http://${server.host}:${server.port}//example.com/es//astro.build/press`,
				);
				assert.equal(res.status, 404);
			});

			it('Does not append a trailing slash to a backslash-prefixed path', async () => {
				// A path like `/\example.com/press` is treated by browsers as
				// `//example.com/press`. It has to be sent as a raw request line
				// (like `curl --path-as-is`) because URL parsers fold the
				// backslash to a forward slash. It must not produce a 301 that
				// echoes the backslash path back in the `Location` header.
				const raw = await rawRequest(
					server.host ?? 'localhost',
					server.port,
					'/\\example.com/press',
				);
				assert.match(raw.statusLine, /404/);
				assert.equal(/^location:/im.test(raw.head), false);
			});
		});
	});
	describe('Never', async () => {
		describe('With base', async () => {
			before(async () => {
				process.env.ASTRO_NODE_AUTOSTART = 'disabled';

				fixture = await loadFixture({
					root: './fixtures/trailing-slash/',
					base: '/some-base',
					output: 'static',
					trailingSlash: 'never',
					outDir: './dist/never-with-base',
					adapter: nodejs({ mode: 'standalone' }),
				});
				await fixture.build();
				const { startServer } = await fixture.loadAdapterEntryModule();
				const res = startServer();
				server = res.server;
				await waitServerListen(server.server);
			});

			after(async () => {
				await server.stop();
				await fixture.clean();
			});

			it('Can render prerendered base route', async () => {
				const res = await fetch(`http://${server.host}:${server.port}`);
				const html = await res.text();
				const $ = cheerio.load(html);

				assert.equal(res.status, 200);
				assert.equal($('h1').text(), 'Index');
			});

			it('Can render prerendered route with redirect', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/some-base/one/`, {
					redirect: 'manual',
				});
				assert.equal(res.status, 301);
				assert.equal(res.headers.get('location'), '/some-base/one');
			});

			it('Can render prerendered route with redirect and query params', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/some-base/one/?foo=bar`, {
					redirect: 'manual',
				});

				assert.equal(res.status, 301);
				assert.equal(res.headers.get('location'), '/some-base/one?foo=bar');
			});

			it('Can render prerendered route with query params', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/some-base/one?foo=bar`);
				const html = await res.text();
				const $ = cheerio.load(html);

				assert.equal(res.status, 200);
				assert.equal($('h1').text(), 'One');
			});
		});
		describe('Without base', async () => {
			before(async () => {
				process.env.ASTRO_NODE_AUTOSTART = 'disabled';

				fixture = await loadFixture({
					root: './fixtures/trailing-slash/',
					output: 'static',
					trailingSlash: 'never',
					outDir: './dist/never-without-base',
					adapter: nodejs({ mode: 'standalone' }),
				});
				await fixture.build();
				const { startServer } = await fixture.loadAdapterEntryModule();
				const res = startServer();
				server = res.server;
				await waitServerListen(server.server);
			});

			after(async () => {
				await server.stop();
				await fixture.clean();
			});

			it('Can render prerendered base route', async () => {
				const res = await fetch(`http://${server.host}:${server.port}`);
				const html = await res.text();
				const $ = cheerio.load(html);

				assert.equal(res.status, 200);
				assert.equal($('h1').text(), 'Index');
			});

			it('Can render prerendered route with redirect', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/one/`, {
					redirect: 'manual',
				});
				assert.equal(res.status, 301);
				assert.equal(res.headers.get('location'), '/one');
			});

			it('Can render prerendered route with redirect and query params', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/one/?foo=bar`, {
					redirect: 'manual',
				});

				assert.equal(res.status, 301);
				assert.equal(res.headers.get('location'), '/one?foo=bar');
			});

			it('Can render prerendered route and query params', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/one?foo=bar`);
				const html = await res.text();
				const $ = cheerio.load(html);

				assert.equal(res.status, 200);
				assert.equal($('h1').text(), 'One');
			});

			it('Can render prerendered non-ASCII route without trailing slash', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/${encodeURI('สวัสดี')}`, {
					redirect: 'manual',
				});
				const html = await res.text();
				const $ = cheerio.load(html);

				assert.equal(res.status, 200);
				assert.equal($('h1').text(), 'สวัสดี');
			});

			it('Redirects prerendered non-ASCII route with trailing slash', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/${encodeURI('สวัสดี')}/`, {
					redirect: 'manual',
				});

				assert.equal(res.status, 301);
				assert.equal(res.headers.get('location'), `/${encodeURI('สวัสดี')}`);
			});
		});
	});
	describe('Ignore', async () => {
		describe('With base', async () => {
			before(async () => {
				process.env.ASTRO_NODE_AUTOSTART = 'disabled';

				fixture = await loadFixture({
					root: './fixtures/trailing-slash/',
					base: '/some-base',
					output: 'static',
					trailingSlash: 'ignore',
					outDir: './dist/ignore-with-base',
					adapter: nodejs({ mode: 'standalone' }),
				});
				await fixture.build();
				const { startServer } = await fixture.loadAdapterEntryModule();
				const res = startServer();
				server = res.server;
				await waitServerListen(server.server);
			});

			after(async () => {
				await server.stop();
				await fixture.clean();
			});

			it('Can render prerendered base route', async () => {
				const res = await fetch(`http://${server.host}:${server.port}`);
				const html = await res.text();
				const $ = cheerio.load(html);

				assert.equal(res.status, 200);
				assert.equal($('h1').text(), 'Index');
			});

			it('Can render prerendered route with slash', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/some-base/one/`, {
					redirect: 'manual',
				});
				const html = await res.text();
				const $ = cheerio.load(html);

				assert.equal(res.status, 200);
				assert.equal($('h1').text(), 'One');
			});

			it('Can render prerendered route without slash', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/some-base/one`, {
					redirect: 'manual',
				});
				const html = await res.text();
				const $ = cheerio.load(html);

				assert.equal(res.status, 200);
				assert.equal($('h1').text(), 'One');
			});

			it('Can render prerendered route with slash and query params', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/some-base/one/?foo=bar`, {
					redirect: 'manual',
				});
				const html = await res.text();
				const $ = cheerio.load(html);

				assert.equal(res.status, 200);
				assert.equal($('h1').text(), 'One');
			});

			it('Can render prerendered route without slash and with query params', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/some-base/one?foo=bar`, {
					redirect: 'manual',
				});
				const html = await res.text();
				const $ = cheerio.load(html);

				assert.equal(res.status, 200);
				assert.equal($('h1').text(), 'One');
			});
		});
		describe('Without base', async () => {
			before(async () => {
				process.env.ASTRO_NODE_AUTOSTART = 'disabled';

				fixture = await loadFixture({
					root: './fixtures/trailing-slash/',
					output: 'static',
					trailingSlash: 'ignore',
					outDir: './dist/ignore-without-base',
					adapter: nodejs({ mode: 'standalone' }),
				});
				await fixture.build();
				const { startServer } = await fixture.loadAdapterEntryModule();
				const res = startServer();
				server = res.server;
				await waitServerListen(server.server);
			});

			after(async () => {
				await server.stop();
				await fixture.clean();
			});

			it('Can render prerendered base route', async () => {
				const res = await fetch(`http://${server.host}:${server.port}`);
				const html = await res.text();
				const $ = cheerio.load(html);

				assert.equal(res.status, 200);
				assert.equal($('h1').text(), 'Index');
			});

			it('Can render prerendered route with slash', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/one/`);
				const html = await res.text();
				const $ = cheerio.load(html);

				assert.equal(res.status, 200);
				assert.equal($('h1').text(), 'One');
			});

			it('Can render prerendered route without slash', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/one`);
				const html = await res.text();
				const $ = cheerio.load(html);

				assert.equal(res.status, 200);
				assert.equal($('h1').text(), 'One');
			});

			it('Can render prerendered route with slash and query params', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/one/?foo=bar`, {
					redirect: 'manual',
				});
				const html = await res.text();
				const $ = cheerio.load(html);

				assert.equal(res.status, 200);
				assert.equal($('h1').text(), 'One');
			});

			it('Can render prerendered route without slash and with query params', async () => {
				const res = await fetch(`http://${server.host}:${server.port}/one?foo=bar`);
				const html = await res.text();
				const $ = cheerio.load(html);

				assert.equal(res.status, 200);
				assert.equal($('h1').text(), 'One');
			});
		});
	});
});
