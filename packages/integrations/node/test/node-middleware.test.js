import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import express from 'express';
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
		let res = startServer();
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

describe('behavior from middleware, pass middleware to standalone', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let server;

	before(async () => {
		process.env.PRERENDER = false;
		fixture = await loadFixture({
			root: './fixtures/node-middleware/',
			output: 'server',
			adapter: nodejs(
				{
					mode: 'standalone',
					middleware: `${import.meta.dirname}/fixtures/node-middleware/src/node-middleware.mjs`,
				}
			),
		});
		await fixture.build();
		const { startServer } = await fixture.loadAdapterEntryModule();
		let res = await startServer();
		server = res.server;
		await waitServerListen(server.server);
	});

	after(async () => {
		await server.stop();
		await fixture.clean();
		delete process.env.PRERENDER;
	});

	describe('middleware-one', async () => {
		it('when mode is standalone', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/middleware-one`);

			assert.equal(res.status, 200);

			const html = await res.text();
			const $ = cheerio.load(html);

			const body = $('body');
			assert.equal(body.text().includes('This is middleware one'), true);
		});
	});

	describe('middleware-two', async () => {
		it('when mode is standalone', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/middleware-two`);

			assert.equal(res.status, 200);

			const html = await res.text();
			const $ = cheerio.load(html);

			const body = $('body');
			assert.equal(body.text().includes('This is middleware two'), true);
		});
	});
});

describe('behavior from middleware, middleware', () => {
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
		server = app.listen(8888);
	});

	after(async () => {
		server.close();
		await fixture.clean();
		delete process.env.PRERENDER;
	});

	it('when mode is standalone', async () => {
		const res = await fetch(`http://localhost:8888/ssr`);

		assert.equal(res.status, 200);

		const html = await res.text();
		const $ = cheerio.load(html);

		const body = $('body');
		assert.equal(body.text().includes("Here's a random number"), true);
	});
});

describe('behavior from middleware, dont pass middleware option', () => {
	/** @type {import('./test-utils').Fixture} */

	it('when mode is standalone', async () => {
		try {
			await loadFixture({
				root: './fixtures/node-middleware/',
				output: 'server',
				adapter: nodejs({ mode: 'middleware', middleware: `node_middleware.js` }),
			});
			assert.fail('should have thrown an error');
		} catch (err) {
			assert.equal(err.message, `'middleware' option is only available in 'standalone' mode.`);
		}
	});
});
