// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	hasFormLikeHeader,
	createOriginCheckMiddleware,
} from '../../../dist/core/app/middlewares.js';
import { callMiddleware } from '../../../dist/core/middleware/callMiddleware.js';
import { createMockAPIContext, createResponseFunction } from '../mocks.js';

describe('CSRF - hasFormLikeHeader', () => {
	it('returns true for multipart/form-data', () => {
		assert.equal(hasFormLikeHeader('multipart/form-data'), true);
	});

	it('returns true for application/x-www-form-urlencoded', () => {
		assert.equal(hasFormLikeHeader('application/x-www-form-urlencoded'), true);
	});

	it('returns true for text/plain', () => {
		assert.equal(hasFormLikeHeader('text/plain'), true);
	});

	it('is case-insensitive', () => {
		assert.equal(hasFormLikeHeader('MULTIPART/FORM-DATA'), true);
		assert.equal(hasFormLikeHeader('Application/X-WWW-FORM-URLENCODED'), true);
		assert.equal(hasFormLikeHeader('TEXT/PLAIN'), true);
	});

	it('matches when content-type includes extra parameters', () => {
		assert.equal(hasFormLikeHeader('application/x-www-form-urlencoded; charset=utf-8'), true);
		assert.equal(hasFormLikeHeader('multipart/form-data; boundary=something'), true);
	});

	it('returns false for application/json', () => {
		assert.equal(hasFormLikeHeader('application/json'), false);
	});

	it('returns false for application/octet-stream', () => {
		assert.equal(hasFormLikeHeader('application/octet-stream'), false);
	});

	it('returns false for null', () => {
		assert.equal(hasFormLikeHeader(null), false);
	});

	it('returns false for empty string', () => {
		assert.equal(hasFormLikeHeader(''), false);
	});
});

describe('CSRF - createOriginCheckMiddleware', () => {
	const middleware = createOriginCheckMiddleware();
	const responseFn = createResponseFunction('ok');

	/**
	 * @param {object} opts
	 * @param {string} opts.method
	 * @param {string} opts.url
	 * @param {Record<string, string>} [opts.headers]
	 * @param {boolean} [opts.isPrerendered]
	 */
	function callCSRF({ method, url, headers = {}, isPrerendered = false }) {
		const request = new Request(url, { method, headers });
		const ctx = createMockAPIContext({ request, url: new URL(url), isPrerendered });
		return callMiddleware(middleware, ctx, responseFn);
	}

	it('allows GET requests regardless of origin', async () => {
		const res = await callCSRF({
			method: 'GET',
			url: 'http://example.com/api/',
			headers: { origin: 'http://evil.com', 'content-type': 'multipart/form-data' },
		});
		assert.equal(res.status, 200);
	});

	it('allows HEAD requests regardless of origin', async () => {
		const res = await callCSRF({
			method: 'HEAD',
			url: 'http://example.com/api/',
			headers: { origin: 'http://evil.com', 'content-type': 'multipart/form-data' },
		});
		assert.equal(res.status, 200);
	});

	it('allows OPTIONS requests regardless of origin', async () => {
		const res = await callCSRF({
			method: 'OPTIONS',
			url: 'http://example.com/api/',
			headers: { origin: 'http://evil.com', 'content-type': 'multipart/form-data' },
		});
		assert.equal(res.status, 200);
	});

	it('allows any method on prerendered routes', async () => {
		const res = await callCSRF({
			method: 'POST',
			url: 'http://example.com/api/',
			headers: { origin: 'http://evil.com', 'content-type': 'multipart/form-data' },
			isPrerendered: true,
		});
		assert.equal(res.status, 200);
	});

	it('allows POST with same origin', async () => {
		const res = await callCSRF({
			method: 'POST',
			url: 'http://example.com/api/',
			headers: { origin: 'http://example.com', 'content-type': 'multipart/form-data' },
		});
		assert.equal(res.status, 200);
	});

	it('allows PUT with same origin', async () => {
		const res = await callCSRF({
			method: 'PUT',
			url: 'http://example.com/api/',
			headers: {
				origin: 'http://example.com',
				'content-type': 'application/x-www-form-urlencoded',
			},
		});
		assert.equal(res.status, 200);
	});

	it('allows DELETE with same origin', async () => {
		const res = await callCSRF({
			method: 'DELETE',
			url: 'http://example.com/api/',
			headers: { origin: 'http://example.com', 'content-type': 'text/plain' },
		});
		assert.equal(res.status, 200);
	});

	it('allows PATCH with same origin', async () => {
		const res = await callCSRF({
			method: 'PATCH',
			url: 'http://example.com/api/',
			headers: { origin: 'http://example.com', 'content-type': 'multipart/form-data' },
		});
		assert.equal(res.status, 200);
	});

	for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
		it(`blocks cross-origin ${method} with multipart/form-data`, async () => {
			const res = await callCSRF({
				method,
				url: 'http://example.com/api/',
				headers: { origin: 'http://evil.com', 'content-type': 'multipart/form-data' },
			});
			assert.equal(res.status, 403);
		});

		it(`blocks cross-origin ${method} with application/x-www-form-urlencoded`, async () => {
			const res = await callCSRF({
				method,
				url: 'http://example.com/api/',
				headers: {
					origin: 'http://evil.com',
					'content-type': 'application/x-www-form-urlencoded',
				},
			});
			assert.equal(res.status, 403);
		});

		it(`blocks cross-origin ${method} with text/plain`, async () => {
			const res = await callCSRF({
				method,
				url: 'http://example.com/api/',
				headers: { origin: 'http://evil.com', 'content-type': 'text/plain' },
			});
			assert.equal(res.status, 403);
		});
	}

	it('blocks cross-origin POST with no content-type', async () => {
		const res = await callCSRF({
			method: 'POST',
			url: 'http://example.com/api/',
			headers: { origin: 'http://evil.com' },
		});
		assert.equal(res.status, 403);
	});

	it('allows cross-origin POST with application/json', async () => {
		const res = await callCSRF({
			method: 'POST',
			url: 'http://example.com/api/',
			headers: { origin: 'http://evil.com', 'content-type': 'application/json' },
		});
		assert.equal(res.status, 200);
	});

	it('allows cross-origin POST with application/octet-stream', async () => {
		const res = await callCSRF({
			method: 'POST',
			url: 'http://example.com/api/',
			headers: { origin: 'http://evil.com', 'content-type': 'application/octet-stream' },
		});
		assert.equal(res.status, 200);
	});

	it('blocks cross-origin POST with uppercased form content-type', async () => {
		const res = await callCSRF({
			method: 'POST',
			url: 'http://example.com/api/',
			headers: { origin: 'http://evil.com', 'content-type': 'MULTIPART/FORM-DATA' },
		});
		assert.equal(res.status, 403);
	});

	it('blocks cross-origin POST with form content-type containing extra params', async () => {
		const res = await callCSRF({
			method: 'POST',
			url: 'http://example.com/api/',
			headers: {
				origin: 'http://evil.com',
				'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
			},
		});
		assert.equal(res.status, 403);
	});

	it('403 response includes a descriptive message', async () => {
		const res = await callCSRF({
			method: 'POST',
			url: 'http://example.com/api/',
			headers: { origin: 'http://evil.com', 'content-type': 'multipart/form-data' },
		});
		const body = await res.text();
		assert.equal(body, 'Cross-site POST form submissions are forbidden');
	});
});
