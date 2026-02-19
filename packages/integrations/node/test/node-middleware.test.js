import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import fastifyMiddie from '@fastify/middie';
import fastifyStatic from '@fastify/static';
import * as cheerio from 'cheerio';
import express from 'express';
import Fastify from 'fastify';
import nodejs from '../dist/index.js';
import { loadFixture, waitServerListen } from './test-utils.js';

/**
 * @typedef {import('../../../astro/test/test-utils').Fixture} Fixture
 */

describe('behavior from middleware, standalone', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let server;

	before(async () => {
		process.env.PRERENDER = false;
		fixture = await loadFixture({
			root: './fixtures/node-middleware/',
			output: 'server',
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

		delete process.env.PRERENDER;
	});

	describe('404', async () => {
		it('when mode is standalone', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/error-page`);

			assert.equal(res.status, 404);

			const html = await res.text();
			const $ = cheerio.load(html);

			const body = $('body');
			assert.equal(body.text().includes('Page does not exist'), true);
		});
	});
});

describe('behavior from middleware, middleware with express', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let server;

	before(async () => {
		process.env.PRERENDER = false;
		fixture = await loadFixture({
			root: './fixtures/node-middleware/',
			output: 'server',
			adapter: nodejs({ mode: 'middleware' }),
		});
		await fixture.build();
		const { handler } = await fixture.loadAdapterEntryModule();
		const app = express();
		app.use(handler);
		server = app.listen(8889);
	});

	after(async () => {
		server.close();
		await fixture.clean();

		delete process.env.PRERENDER;
	});

	it('should render the endpoint', async () => {
		const res = await fetch('http://localhost:8889/ssr');

		assert.equal(res.status, 200);

		const html = await res.text();
		const $ = cheerio.load(html);

		const body = $('body');
		assert.equal(body.text().includes("Here's a random number"), true);
	});

	it('should render the index.html page [static]', async () => {
		const res = await fetch('http://localhost:8889/');

		assert.equal(res.status, 200);

		const html = await res.text();
		const $ = cheerio.load(html);

		const body = $('body');
		assert.equal(body.text().includes('1'), true);
	});

	it('should render the index.html page [static] when the URL has the hash', async () => {
		const res = await fetch('http://localhost:8889/#');

		assert.equal(res.status, 200);

		const html = await res.text();
		const $ = cheerio.load(html);

		const body = $('body');
		assert.equal(body.text().includes('1'), true);
	});

	it('should render the dynamic pages', async () => {
		let res = await fetch('http://localhost:8889/dyn/foo');

		assert.equal(res.status, 200);

		let html = await res.text();
		let $ = cheerio.load(html);

		let body = $('body');
		assert.equal(body.text().includes('foo'), true);

		res = await fetch('http://localhost:8889/dyn/bar');

		assert.equal(res.status, 200);

		html = await res.text();
		$ = cheerio.load(html);

		body = $('body');
		assert.equal(body.text().includes('bar'), true);
	});
});

describe('behavior from middleware, middleware with fastify', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let server;

	before(async () => {
		process.env.PRERENDER = false;
		fixture = await loadFixture({
			root: './fixtures/node-middleware/',
			output: 'server',
			adapter: nodejs({ mode: 'middleware' }),
		});
		await fixture.build();
		const { handler } = await fixture.loadAdapterEntryModule();
		const app = Fastify({ logger: false });
		await app
			.register(fastifyStatic, {
				root: fileURLToPath(new URL('./dist/client', import.meta.url)),
			})
			.register(fastifyMiddie);
		app.use(handler);

		await app.listen({ port: 8889 });

		server = app;
	});

	after(async () => {
		server.close();
		await fixture.clean();

		delete process.env.PRERENDER;
	});

	it('should render the endpoint', async () => {
		const res = await fetch('http://localhost:8889/ssr');

		assert.equal(res.status, 200);

		const html = await res.text();
		const $ = cheerio.load(html);

		const body = $('body');
		assert.equal(body.text().includes("Here's a random number"), true);
	});

	it('should render the index.html page [static]', async () => {
		const res = await fetch('http://localhost:8889');

		assert.equal(res.status, 200);

		const html = await res.text();
		const $ = cheerio.load(html);

		const body = $('body');
		assert.equal(body.text().includes('1'), true);
	});

	it('should render the dynamic pages', async () => {
		let res = await fetch('http://localhost:8889/dyn/foo');

		assert.equal(res.status, 200);

		let html = await res.text();
		let $ = cheerio.load(html);

		let body = $('body');
		assert.equal(body.text().includes('foo'), true);

		res = await fetch('http://localhost:8889/dyn/bar');

		assert.equal(res.status, 200);

		html = await res.text();
		$ = cheerio.load(html);

		body = $('body');
		assert.equal(body.text().includes('bar'), true);
	});
});
