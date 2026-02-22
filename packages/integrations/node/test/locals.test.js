import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import node from '../dist/index.js';
import { createRequestAndResponse, loadFixture } from './test-utils.js';

describe('API routes', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/locals/',
			output: 'server',
			adapter: node({
				serverEntrypoint: '@astrojs/node/node-handler',
			}),
		});
		await fixture.build();
	});

	it('Can use locals added by node middleware', async () => {
		const { nodeHandler } = await fixture.loadAdapterEntryModule()
		const { req, res, text } = createRequestAndResponse({
			url: '/from-node-middleware',
		});

		const locals = { foo: 'bar' };

		nodeHandler(req, res, () => {}, locals);
		req.send();

		const html = await text();

		assert.equal(html.includes('<h1>bar</h1>'), true);
	});

	it('Throws an error when provided non-objects as locals', async () => {
		const { nodeHandler } = await fixture.loadAdapterEntryModule()
		const { req, res, done } = createRequestAndResponse({
			url: '/from-node-middleware',
		});

		nodeHandler(req, res, undefined, 'locals');
		req.send();

		await done;
		assert.equal(res.statusCode, 500);
	});

	it('Can use locals added by astro middleware', async () => {
		const { nodeHandler } = await fixture.loadAdapterEntryModule()

		const { req, res, text } = createRequestAndResponse({
			url: '/from-astro-middleware',
		});

		nodeHandler(req, res, () => {});
		req.send();

		const html = await text();

		assert.equal(html.includes('<h1>baz</h1>'), true);
	});

	it('Can access locals in API', async () => {
		const { nodeHandler } = await fixture.loadAdapterEntryModule()
		const { req, res, done } = createRequestAndResponse({
			method: 'POST',
			url: '/api',
		});

		const locals = { foo: 'bar' };

		nodeHandler(req, res, () => {}, locals);
		req.send();

		const [buffer] = await done;

		const json = JSON.parse(buffer.toString('utf-8'));

		assert.equal(json.foo, 'bar');
	});
});
