import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { RemotePattern } from '@astrojs/internal-helpers/remote';
import { secFetchMiddleware } from '../../../dist/vite-plugin-astro-server/sec-fetch.js';
import { createRequestAndResponse, defaultLogger } from '../test-utils.ts';

/**
 * Helper to run a request through the secFetchMiddleware and return whether
 * it was blocked (response ended with 403) or allowed (next() was called).
 */
function runMiddleware(
	headers: Record<string, string>,
	allowedDomains?: Partial<RemotePattern>[],
): Promise<{ nextCalled: boolean; statusCode: number }> {
	const middleware = secFetchMiddleware(defaultLogger, allowedDomains);
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

	describe('allowedDomains support', () => {
		const allowedDomains: Partial<RemotePattern>[] = [
			{ hostname: 'myproxy.example.com', protocol: 'https' },
			{ hostname: '*.ngrok.io', protocol: 'https' },
		];

		it('allows cross-site request when Origin matches an allowed domain', async () => {
			const result = await runMiddleware(
				{
					'sec-fetch-site': 'cross-site',
					'sec-fetch-mode': 'cors',
					origin: 'https://myproxy.example.com',
				},
				allowedDomains,
			);
			assert.equal(result.nextCalled, true);
		});

		it('allows cross-site request when Origin matches a wildcard allowed domain', async () => {
			const result = await runMiddleware(
				{
					'sec-fetch-site': 'cross-site',
					'sec-fetch-mode': 'cors',
					origin: 'https://abc123.ngrok.io',
				},
				allowedDomains,
			);
			assert.equal(result.nextCalled, true);
		});

		it('blocks cross-site request when Origin does not match allowed domains', async () => {
			const result = await runMiddleware(
				{
					'sec-fetch-site': 'cross-site',
					'sec-fetch-mode': 'cors',
					origin: 'https://evil.example.com',
				},
				allowedDomains,
			);
			assert.equal(result.nextCalled, false);
			assert.equal(result.statusCode, 403);
		});

		it('blocks cross-site request when no Origin header is present', async () => {
			const result = await runMiddleware(
				{
					'sec-fetch-site': 'cross-site',
					'sec-fetch-mode': 'cors',
				},
				allowedDomains,
			);
			assert.equal(result.nextCalled, false);
			assert.equal(result.statusCode, 403);
		});

		it('blocks cross-site request when allowedDomains is empty', async () => {
			const result = await runMiddleware(
				{
					'sec-fetch-site': 'cross-site',
					'sec-fetch-mode': 'cors',
					origin: 'https://myproxy.example.com',
				},
				[],
			);
			assert.equal(result.nextCalled, false);
			assert.equal(result.statusCode, 403);
		});
	});
});
