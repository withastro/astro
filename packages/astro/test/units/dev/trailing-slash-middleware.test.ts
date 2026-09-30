import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	createProxyMatcher,
	trailingSlashMiddleware,
} from '../../../dist/vite-plugin-astro-server/trailing-slash.js';
import { createBasicSettings, createRequestAndResponse } from '../test-utils.ts';

async function runMiddleware(url: string, proxy?: Record<string, unknown>) {
	const settings = await createBasicSettings({ trailingSlash: 'always' });
	const middleware = trailingSlashMiddleware(settings, proxy);
	const { req, res } = createRequestAndResponse({ method: 'GET', url });
	let nextCalled = false;
	middleware(req, res, () => {
		nextCalled = true;
	});
	return { nextCalled, statusCode: (res as any).statusCode };
}

describe('trailingSlashMiddleware — Vite server.proxy', () => {
	it('passes proxied URLs through without the mismatch 404', async () => {
		const result = await runMiddleware('/api/hello', { '/api': 'http://localhost:9999' });
		assert.equal(result.nextCalled, true);
		assert.notEqual(result.statusCode, 404);
	});

	it('still rejects mismatched URLs outside proxied prefixes', async () => {
		const result = await runMiddleware('/about', { '/api': 'http://localhost:9999' });
		assert.equal(result.nextCalled, false);
		assert.equal(result.statusCode, 404);
	});

	it('rejects mismatched URLs when no proxy is configured', async () => {
		const result = await runMiddleware('/api/hello');
		assert.equal(result.nextCalled, false);
		assert.equal(result.statusCode, 404);
	});
});

describe('createProxyMatcher', () => {
	it('matches string keys as URL prefixes', () => {
		const isProxied = createProxyMatcher({ '/api': 'http://localhost:9999' });
		assert.equal(isProxied('/api/hello?x=1'), true);
		assert.equal(isProxied('/about'), false);
	});

	it('matches keys starting with ^ as regular expressions', () => {
		const isProxied = createProxyMatcher({ '^/fallback/.*': 'http://localhost:9999' });
		assert.equal(isProxied('/fallback/foo'), true);
		assert.equal(isProxied('/other/fallback/foo'), false);
	});

	it('matches nothing when proxy is undefined', () => {
		assert.equal(createProxyMatcher(undefined)('/api'), false);
	});
});
