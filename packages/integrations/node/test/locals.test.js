import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import nodejs from '../dist/index.js';
import { createRequestAndResponse, loadFixture } from './test-utils.js';

describe('API routes', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/locals/',
			output: 'server',
			adapter: nodejs({ mode: 'middleware' }),
		});
		await fixture.build();
	});

	it('Can use locals added by node middleware', async () => {
		const { handler } = await import('./fixtures/locals/dist/server/entry.mjs');
		// biome-ignore lint/style/useConst: <explanation>
		let { req, res, text } = createRequestAndResponse({
			url: '/from-node-middleware',
		});

		// biome-ignore lint/style/useConst: <explanation>
		let locals = { foo: 'bar' };

		handler(req, res, () => {}, locals);
		req.send();

		// biome-ignore lint/style/useConst: <explanation>
		let html = await text();

		assert.equal(html.includes('<h1>bar</h1>'), true);
	});

	it('Throws an error when provided non-objects as locals', async () => {
		const { handler } = await import('./fixtures/locals/dist/server/entry.mjs');
		// biome-ignore lint/style/useConst: <explanation>
		let { req, res, done } = createRequestAndResponse({
			url: '/from-node-middleware',
		});

		handler(req, res, undefined, 'locals');
		req.send();

		await done;
		assert.equal(res.statusCode, 500);
	});

	it('Can use locals added by astro middleware', async () => {
		const { handler } = await import('./fixtures/locals/dist/server/entry.mjs');

		const { req, res, text } = createRequestAndResponse({
			url: '/from-astro-middleware',
		});

		handler(req, res, () => {});
		req.send();

		const html = await text();

		assert.equal(html.includes('<h1>baz</h1>'), true);
	});

	it('Can access locals in API', async () => {
		const { handler } = await import('./fixtures/locals/dist/server/entry.mjs');
		// biome-ignore lint/style/useConst: <explanation>
		let { req, res, done } = createRequestAndResponse({
			method: 'POST',
			url: '/api',
		});

		// biome-ignore lint/style/useConst: <explanation>
		let locals = { foo: 'bar' };

		handler(req, res, () => {}, locals);
		req.send();

		// biome-ignore lint/style/useConst: <explanation>
		let [buffer] = await done;

		// biome-ignore lint/style/useConst: <explanation>
		let json = JSON.parse(buffer.toString('utf-8'));

		assert.equal(json.foo, 'bar');
	});
});
