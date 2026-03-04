import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { secFetchMiddleware } from '../../../dist/vite-plugin-astro-server/sec-fetch.js';
import { createRequestAndResponse } from '../test-utils.js';

/**
 * Helper to run a request through the secFetchMiddleware and return whether
 * it was blocked (response ended with 403) or allowed (next() was called).
 */
function runMiddleware(headers) {
	const middleware = secFetchMiddleware();
	const { req, res, done } = createRequestAndResponse({
		method: 'GET',
		url: '/src/pages/index.astro',
		headers,
	});

	let nextCalled = false;
	middleware(req, res, () => {
		nextCalled = true;
		res.statusCode = 200;
		res.end();
	});

	return done.then(() => ({
		nextCalled,
		statusCode: res.statusCode,
	}));
}

describe('secFetchMiddleware', () => {
	describe('allows same-origin requests', () => {
		it('allows requests with Sec-Fetch-Site: same-origin', async () => {
			const result = await runMiddleware({
				'sec-fetch-site': 'same-origin',
				'sec-fetch-mode': 'cors',
			});
			assert.equal(result.nextCalled, true);
		});

		it('allows requests with Sec-Fetch-Site: same-site', async () => {
			const result = await runMiddleware({
				'sec-fetch-site': 'same-site',
				'sec-fetch-mode': 'cors',
			});
			assert.equal(result.nextCalled, true);
		});

		it('allows requests with Sec-Fetch-Site: none (direct navigation)', async () => {
			const result = await runMiddleware({
				'sec-fetch-site': 'none',
				'sec-fetch-mode': 'navigate',
			});
			assert.equal(result.nextCalled, true);
		});
	});

	describe('allows requests without Sec-Fetch headers', () => {
		it('allows requests with no Sec-Fetch headers (non-browser clients)', async () => {
			const result = await runMiddleware({});
			assert.equal(result.nextCalled, true);
		});
	});

	describe('allows cross-origin navigation requests', () => {
		it('allows cross-site navigate requests', async () => {
			const result = await runMiddleware({
				'sec-fetch-site': 'cross-site',
				'sec-fetch-mode': 'navigate',
			});
			assert.equal(result.nextCalled, true);
		});

		it('allows cross-origin navigate requests', async () => {
			const result = await runMiddleware({
				'sec-fetch-site': 'cross-site',
				'sec-fetch-mode': 'nested-navigate',
			});
			assert.equal(result.nextCalled, true);
		});
	});

	describe('allows websocket requests', () => {
		it('allows cross-site websocket upgrades (HMR)', async () => {
			const result = await runMiddleware({
				'sec-fetch-site': 'cross-site',
				'sec-fetch-mode': 'websocket',
			});
			assert.equal(result.nextCalled, true);
		});
	});

	describe('blocks cross-origin subresource requests', () => {
		it('blocks cross-site no-cors requests (script tag from another origin)', async () => {
			const result = await runMiddleware({
				'sec-fetch-site': 'cross-site',
				'sec-fetch-mode': 'no-cors',
				'sec-fetch-dest': 'script',
			});
			assert.equal(result.nextCalled, false);
			assert.equal(result.statusCode, 403);
		});

		it('blocks cross-site cors requests', async () => {
			const result = await runMiddleware({
				'sec-fetch-site': 'cross-site',
				'sec-fetch-mode': 'cors',
				'sec-fetch-dest': 'script',
			});
			assert.equal(result.nextCalled, false);
			assert.equal(result.statusCode, 403);
		});

		it('blocks cross-origin no-cors requests', async () => {
			const result = await runMiddleware({
				'sec-fetch-site': 'cross-site',
				'sec-fetch-mode': 'no-cors',
				'sec-fetch-dest': 'empty',
			});
			assert.equal(result.nextCalled, false);
			assert.equal(result.statusCode, 403);
		});

		it('blocks cross-site requests with no Sec-Fetch-Mode', async () => {
			const result = await runMiddleware({
				'sec-fetch-site': 'cross-site',
			});
			assert.equal(result.nextCalled, false);
			assert.equal(result.statusCode, 403);
		});
	});
});
