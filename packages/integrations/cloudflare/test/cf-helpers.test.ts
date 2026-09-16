import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	createLocals,
	getClientAddress,
	matchStaticAsset,
	fallbackToAssets,
	createErrorPageFetch,
} from '../dist/utils/cf-helpers.js';

/**
 * Creates a mock ASSETS binding with a configurable fetch response.
 */
function createMockEnv(
	fetchResult: { status: number; body?: string } = { status: 200, body: 'asset' },
) {
	return {
		ASSETS: {
			fetch(url: string) {
				return Promise.resolve(
					new Response(fetchResult.body ?? null, {
						status: fetchResult.status,
						headers: { 'x-fetched-url': url },
					}),
				);
			},
		},
	};
}

/**
 * Creates a mock ExecutionContext.
 */
function createMockCtx() {
	return {
		waitUntil: () => {},
		passThroughOnException: () => {},
	};
}

// #region createLocals

describe('createLocals', () => {
	it('sets cfContext on the returned locals', () => {
		const ctx = createMockCtx();
		const locals = createLocals(ctx as any);
		assert.equal(locals.cfContext, ctx);
	});

	it('defines a non-enumerable runtime property', () => {
		const locals = createLocals(createMockCtx() as any);
		const descriptor = Object.getOwnPropertyDescriptor(locals, 'runtime');
		assert.ok(descriptor, 'runtime property should exist');
		assert.equal(descriptor!.enumerable, false);
	});

	it('runtime.env throws with migration message', () => {
		const locals = createLocals(createMockCtx() as any) as any;
		assert.throws(() => locals.runtime.env, /removed in Astro v6/);
		assert.throws(() => locals.runtime.env, /cloudflare:workers/);
	});

	it('runtime.cf throws with migration message', () => {
		const locals = createLocals(createMockCtx() as any) as any;
		assert.throws(() => locals.runtime.cf, /removed in Astro v6/);
		assert.throws(() => locals.runtime.cf, /Astro\.request\.cf/);
	});

	it('runtime.caches throws with migration message', () => {
		const locals = createLocals(createMockCtx() as any) as any;
		assert.throws(() => locals.runtime.caches, /removed in Astro v6/);
		assert.throws(() => locals.runtime.caches, /global 'caches'/);
	});

	it('runtime.ctx throws with migration message', () => {
		const locals = createLocals(createMockCtx() as any) as any;
		assert.throws(() => locals.runtime.ctx, /removed in Astro v6/);
		assert.throws(() => locals.runtime.ctx, /Astro\.locals\.cfContext/);
	});
});

// #endregion

// #region getClientAddress

describe('getClientAddress', () => {
	it('returns the IP from cf-connecting-ip header', () => {
		const request = new Request('http://example.com/', {
			headers: { 'cf-connecting-ip': '203.0.113.50' },
		});
		assert.equal(getClientAddress(request), '203.0.113.50');
	});

	it('returns only the first IP from a multi-value header', () => {
		const request = new Request('http://example.com/', {
			headers: { 'cf-connecting-ip': '203.0.113.50, 70.41.3.18' },
		});
		assert.equal(getClientAddress(request), '203.0.113.50');
	});

	it('returns undefined when the header is missing', () => {
		const request = new Request('http://example.com/');
		assert.equal(getClientAddress(request), undefined);
	});

	it('returns undefined for invalid IP values', () => {
		const request = new Request('http://example.com/', {
			headers: { 'cf-connecting-ip': '<script>alert(1)</script>' },
		});
		assert.equal(getClientAddress(request), undefined);
	});
});

// #endregion

// #region matchStaticAsset

describe('matchStaticAsset', () => {
	it('returns a response when the pathname matches a known asset', async () => {
		const manifest = { assets: new Set(['/style.css']) };
		const env = createMockEnv();
		const result = matchStaticAsset(manifest as any, 'http://example.com/style.css', env as any);
		assert.ok(result != null);
		const response = await result;
		assert.equal(response.status, 200);
	});

	it('strips .html extension when fetching from ASSETS', async () => {
		const manifest = { assets: new Set(['/page.html']) };
		const env = createMockEnv();
		const result = matchStaticAsset(manifest as any, 'http://example.com/page.html', env as any);
		const response = await result!;
		assert.equal(response.headers.get('x-fetched-url'), 'http://example.com/page');
	});

	it('returns undefined when the pathname is not a known asset', () => {
		const manifest = { assets: new Set(['/style.css']) };
		const env = createMockEnv();
		const result = matchStaticAsset(manifest as any, 'http://example.com/other.js', env as any);
		assert.equal(result, undefined);
	});
});

// #endregion

// #region fallbackToAssets

describe('fallbackToAssets', () => {
	it('returns the asset response when ASSETS returns non-404', async () => {
		const env = createMockEnv({ status: 200, body: 'fallback asset' });
		const result = await fallbackToAssets('http://example.com/unknown', env as any);
		assert.ok(result);
		assert.equal(result!.status, 200);
	});

	it('returns undefined when ASSETS returns 404', async () => {
		const env = createMockEnv({ status: 404 });
		const result = await fallbackToAssets('http://example.com/unknown', env as any);
		assert.equal(result, undefined);
	});

	it('strips .html and index.html from the URL', async () => {
		const env = createMockEnv({ status: 200 });
		const result = await fallbackToAssets('http://example.com/about/index.html', env as any);
		assert.ok(result);
		assert.equal(result!.headers.get('x-fetched-url'), 'http://example.com/about/');
	});
});

// #endregion

// #region createErrorPageFetch

describe('createErrorPageFetch', () => {
	it('returns a function that fetches from ASSETS', async () => {
		const env = createMockEnv({ status: 200, body: '404 page' });
		const fetchFn = createErrorPageFetch(env as any);
		const response = await fetchFn('http://example.com/404.html');
		assert.equal(response.status, 200);
	});

	it('strips .html extension from the URL', async () => {
		const env = createMockEnv({ status: 200 });
		const fetchFn = createErrorPageFetch(env as any);
		const response = await fetchFn('http://example.com/404.html');
		assert.equal(response.headers.get('x-fetched-url'), 'http://example.com/404');
	});
});

// #endregion
