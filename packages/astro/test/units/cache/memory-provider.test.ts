import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CacheProvider } from '../../../dist/core/cache/types.js';
import type { MemoryCacheProviderOptions } from '../../../dist/core/cache/memory-provider.js';
import memoryProvider from '../../../dist/core/cache/memory-provider.js';

/**
 * Helper: create a CacheProvider instance with optional config.
 */
function createProvider(config?: MemoryCacheProviderOptions): CacheProvider {
	return memoryProvider(config);
}

/**
 * Helper: create a minimal Request.
 */
function makeRequest(url: string, headers: Record<string, string> = {}): Request {
	return new Request(url, { headers });
}

/**
 * Helper: create a next() function that returns a Response with cache headers.
 */
function makeNext({
	body = 'ok',
	status = 200,
	maxAge,
	swr,
	tags,
	headers = {},
}: {
	body?: string;
	status?: number;
	maxAge?: number;
	swr?: number;
	tags?: string[];
	headers?: Record<string, string>;
} = {}): () => Promise<Response> {
	return async () => {
		const h = new Headers(headers);
		const parts: string[] = [];
		if (maxAge !== undefined) parts.push(`max-age=${maxAge}`);
		if (swr !== undefined) parts.push(`stale-while-revalidate=${swr}`);
		if (parts.length > 0) h.set('CDN-Cache-Control', parts.join(', '));
		if (tags?.length) h.set('Cache-Tag', tags.join(', '));
		return new Response(body, { status, headers: h });
	};
}

// #region onRequest: basic caching

describe('memory-provider onRequest', () => {
	it('passes through when no cache headers on response', async () => {
		const provider = createProvider();
		const req = makeRequest('http://localhost/page');
		const res = await provider.onRequest!({ request: req, url: new URL(req.url) }, makeNext());
		assert.equal(await res.text(), 'ok');
		assert.equal(res.headers.has('X-Astro-Cache'), false);
	});

	it('returns MISS on first cacheable request', async () => {
		const provider = createProvider();
		const req = makeRequest('http://localhost/page');
		const res = await provider.onRequest!(
			{ request: req, url: new URL(req.url) },
			makeNext({ maxAge: 60 }),
		);
		assert.equal(res.headers.get('X-Astro-Cache'), 'MISS');
		assert.equal(await res.text(), 'ok');
	});

	it('returns HIT on second request to same URL', async () => {
		const provider = createProvider();
		const url = 'http://localhost/page';

		// First request — MISS
		const req1 = makeRequest(url);
		await provider.onRequest!(
			{ request: req1, url: new URL(req1.url) },
			makeNext({ maxAge: 60, body: 'first' }),
		);

		// Second request — HIT
		const req2 = makeRequest(url);
		const res2 = await provider.onRequest!(
			{ request: req2, url: new URL(req2.url) },
			makeNext({ maxAge: 60, body: 'second' }),
		);
		assert.equal(res2.headers.get('X-Astro-Cache'), 'HIT');
		assert.equal(await res2.text(), 'first');
	});

	it('skips caching for non-GET requests', async () => {
		const provider = createProvider();
		const req = new Request('http://localhost/page', { method: 'POST' });
		let called = false;
		const res = await provider.onRequest!({ request: req, url: new URL(req.url) }, async () => {
			called = true;
			return new Response('posted');
		});
		assert.equal(called, true);
		assert.equal(await res.text(), 'posted');
		assert.equal(res.headers.has('X-Astro-Cache'), false);
	});

	it('does not cache responses with Set-Cookie header', async () => {
		const provider = createProvider();
		const url = 'http://localhost/page';

		// First request — has Set-Cookie, should not cache
		const req1 = makeRequest(url);
		await provider.onRequest!(
			{ request: req1, url: new URL(req1.url) },
			makeNext({ maxAge: 60, headers: { 'Set-Cookie': 'session=abc' } }),
		);

		// Second request — should be a miss (not cached)
		const req2 = makeRequest(url);
		let nextCalled = false;
		await provider.onRequest!({ request: req2, url: new URL(req2.url) }, async () => {
			nextCalled = true;
			const h = new Headers({ 'CDN-Cache-Control': 'max-age=60' });
			return new Response('fresh', { headers: h });
		});
		assert.equal(nextCalled, true);
	});
});

// #endregion

// #region onRequest: host-aware keys

describe('memory-provider host-aware cache keys', () => {
	it('different hosts produce different cache entries', async () => {
		const provider = createProvider();

		const req1 = makeRequest('http://host-a.com/page');
		await provider.onRequest!(
			{ request: req1, url: new URL(req1.url) },
			makeNext({ maxAge: 60, body: 'host-a' }),
		);

		const req2 = makeRequest('http://host-b.com/page');
		const res2 = await provider.onRequest!(
			{ request: req2, url: new URL(req2.url) },
			makeNext({ maxAge: 60, body: 'host-b' }),
		);
		// Should be a MISS because different host
		assert.equal(res2.headers.get('X-Astro-Cache'), 'MISS');
		assert.equal(await res2.text(), 'host-b');
	});
});

// #endregion

// #region onRequest: query parameter handling

describe('memory-provider query parameters', () => {
	it('sorts query parameters by default (order-independent keys)', async () => {
		const provider = createProvider();

		const req1 = makeRequest('http://localhost/page?b=2&a=1');
		await provider.onRequest!(
			{ request: req1, url: new URL(req1.url) },
			makeNext({ maxAge: 60, body: 'first' }),
		);

		// Same params, different order — should HIT
		const req2 = makeRequest('http://localhost/page?a=1&b=2');
		const res2 = await provider.onRequest!(
			{ request: req2, url: new URL(req2.url) },
			makeNext({ maxAge: 60, body: 'second' }),
		);
		assert.equal(res2.headers.get('X-Astro-Cache'), 'HIT');
	});

	it('excludes utm_* params by default', async () => {
		const provider = createProvider();

		const req1 = makeRequest('http://localhost/page');
		await provider.onRequest!(
			{ request: req1, url: new URL(req1.url) },
			makeNext({ maxAge: 60, body: 'first' }),
		);

		const req2 = makeRequest('http://localhost/page?utm_source=twitter&utm_medium=social');
		const res2 = await provider.onRequest!(
			{ request: req2, url: new URL(req2.url) },
			makeNext({ maxAge: 60, body: 'second' }),
		);
		assert.equal(res2.headers.get('X-Astro-Cache'), 'HIT');
	});

	it('excludes fbclid from cache key by default', async () => {
		const provider = createProvider();

		const req1 = makeRequest('http://localhost/page?page=2');
		await provider.onRequest!(
			{ request: req1, url: new URL(req1.url) },
			makeNext({ maxAge: 60, body: 'page-2' }),
		);

		const req2 = makeRequest('http://localhost/page?page=2&fbclid=abc123');
		const res2 = await provider.onRequest!(
			{ request: req2, url: new URL(req2.url) },
			makeNext({ maxAge: 60, body: 'should-not-see' }),
		);
		assert.equal(res2.headers.get('X-Astro-Cache'), 'HIT');
	});

	it('excludes gclid from cache key by default', async () => {
		const provider = createProvider();

		const req1 = makeRequest('http://localhost/page?page=3');
		await provider.onRequest!(
			{ request: req1, url: new URL(req1.url) },
			makeNext({ maxAge: 60, body: 'page-3' }),
		);

		const req2 = makeRequest('http://localhost/page?page=3&gclid=xyz789');
		const res2 = await provider.onRequest!(
			{ request: req2, url: new URL(req2.url) },
			makeNext({ maxAge: 60, body: 'should-not-see' }),
		);
		assert.equal(res2.headers.get('X-Astro-Cache'), 'HIT');
	});

	it('request with only excluded params matches request with no params', async () => {
		const provider = createProvider();

		const req1 = makeRequest('http://localhost/page');
		await provider.onRequest!(
			{ request: req1, url: new URL(req1.url) },
			makeNext({ maxAge: 60, body: 'no-params' }),
		);

		const req2 = makeRequest('http://localhost/page?utm_source=twitter&fbclid=abc&gclid=xyz');
		const res2 = await provider.onRequest!(
			{ request: req2, url: new URL(req2.url) },
			makeNext({ maxAge: 60, body: 'should-not-see' }),
		);
		assert.equal(res2.headers.get('X-Astro-Cache'), 'HIT');
	});

	it('differentiates on non-excluded params', async () => {
		const provider = createProvider();

		const req1 = makeRequest('http://localhost/page?id=1');
		await provider.onRequest!(
			{ request: req1, url: new URL(req1.url) },
			makeNext({ maxAge: 60, body: 'id-1' }),
		);

		const req2 = makeRequest('http://localhost/page?id=2');
		const res2 = await provider.onRequest!(
			{ request: req2, url: new URL(req2.url) },
			makeNext({ maxAge: 60, body: 'id-2' }),
		);
		assert.equal(res2.headers.get('X-Astro-Cache'), 'MISS');
	});

	it('respects query.include allowlist', async () => {
		const provider = createProvider({ query: { include: ['page'] } });

		const req1 = makeRequest('http://localhost/list?page=1&sort=name');
		await provider.onRequest!(
			{ request: req1, url: new URL(req1.url) },
			makeNext({ maxAge: 60, body: 'page-1' }),
		);

		// Different sort but same page — should HIT (sort not in include list)
		const req2 = makeRequest('http://localhost/list?page=1&sort=date');
		const res2 = await provider.onRequest!(
			{ request: req2, url: new URL(req2.url) },
			makeNext({ maxAge: 60, body: 'page-1-date' }),
		);
		assert.equal(res2.headers.get('X-Astro-Cache'), 'HIT');
	});

	it('request with params not in include list matches request with no params', async () => {
		const provider = createProvider({ query: { include: ['page'] } });

		const req1 = makeRequest('http://localhost/list');
		await provider.onRequest!(
			{ request: req1, url: new URL(req1.url) },
			makeNext({ maxAge: 60, body: 'no-params' }),
		);

		const req2 = makeRequest('http://localhost/list?sort=name&filter=active');
		const res2 = await provider.onRequest!(
			{ request: req2, url: new URL(req2.url) },
			makeNext({ maxAge: 60, body: 'should-not-see' }),
		);
		assert.equal(res2.headers.get('X-Astro-Cache'), 'HIT');
	});

	it('respects query.exclude custom patterns', async () => {
		const provider = createProvider({ query: { exclude: ['session_*'] } });

		const req1 = makeRequest('http://localhost/page?id=1');
		await provider.onRequest!(
			{ request: req1, url: new URL(req1.url) },
			makeNext({ maxAge: 60, body: 'first' }),
		);

		const req2 = makeRequest('http://localhost/page?id=1&session_id=abc');
		const res2 = await provider.onRequest!(
			{ request: req2, url: new URL(req2.url) },
			makeNext({ maxAge: 60, body: 'second' }),
		);
		assert.equal(res2.headers.get('X-Astro-Cache'), 'HIT');
	});

	it('throws when both include and exclude are set', () => {
		assert.throws(() => createProvider({ query: { include: ['a'], exclude: ['b'] } }), {
			name: 'CacheQueryConfigConflict',
		});
	});
});

// #endregion

// #region onRequest: Vary header support

describe('memory-provider Vary header', () => {
	it('caches different entries for different Vary header values', async () => {
		const provider = createProvider();
		const url = 'http://localhost/page';

		// First request: Accept-Language: en
		const req1 = makeRequest(url, { 'Accept-Language': 'en' });
		await provider.onRequest!(
			{ request: req1, url: new URL(req1.url) },
			makeNext({ maxAge: 60, body: 'english', headers: { Vary: 'Accept-Language' } }),
		);

		// Second request: Accept-Language: fr — should MISS
		const req2 = makeRequest(url, { 'Accept-Language': 'fr' });
		const res2 = await provider.onRequest!(
			{ request: req2, url: new URL(req2.url) },
			makeNext({ maxAge: 60, body: 'french', headers: { Vary: 'Accept-Language' } }),
		);
		assert.equal(res2.headers.get('X-Astro-Cache'), 'MISS');
		assert.equal(await res2.text(), 'french');

		// Third request: Accept-Language: en — should HIT from first
		const req3 = makeRequest(url, { 'Accept-Language': 'en' });
		const res3 = await provider.onRequest!(
			{ request: req3, url: new URL(req3.url) },
			makeNext({ maxAge: 60, body: 'should-not-see' }),
		);
		assert.equal(res3.headers.get('X-Astro-Cache'), 'HIT');
		assert.equal(await res3.text(), 'english');
	});

	it('ignores Cookie in Vary header', async () => {
		const provider = createProvider();
		const url = 'http://localhost/page';

		const req1 = makeRequest(url, { Cookie: 'user=a' });
		await provider.onRequest!(
			{ request: req1, url: new URL(req1.url) },
			makeNext({ maxAge: 60, body: 'first', headers: { Vary: 'Cookie' } }),
		);

		// Different cookie — should still HIT (Cookie is ignored in Vary)
		const req2 = makeRequest(url, { Cookie: 'user=b' });
		const res2 = await provider.onRequest!(
			{ request: req2, url: new URL(req2.url) },
			makeNext({ maxAge: 60, body: 'second' }),
		);
		assert.equal(res2.headers.get('X-Astro-Cache'), 'HIT');
	});
});

// #endregion

// #region onRequest: LRU eviction

describe('memory-provider LRU eviction', () => {
	it('evicts oldest entry when max is exceeded', async () => {
		const provider = createProvider({ max: 2 });

		// Fill cache with 2 entries
		for (const path of ['/a', '/b']) {
			const req = makeRequest(`http://localhost${path}`);
			await provider.onRequest!(
				{ request: req, url: new URL(req.url) },
				makeNext({ maxAge: 60, body: path }),
			);
		}

		// Add a third — should evict /a (oldest)
		const req3 = makeRequest('http://localhost/c');
		await provider.onRequest!(
			{ request: req3, url: new URL(req3.url) },
			makeNext({ maxAge: 60, body: '/c' }),
		);

		// /b should still be cached (HIT)
		const reqB = makeRequest('http://localhost/b');
		const resB = await provider.onRequest!(
			{ request: reqB, url: new URL(reqB.url) },
			makeNext({ maxAge: 60, body: '/b-new' }),
		);
		assert.equal(resB.headers.get('X-Astro-Cache'), 'HIT');

		// /c should still be cached (HIT)
		const reqC = makeRequest('http://localhost/c');
		const resC = await provider.onRequest!(
			{ request: reqC, url: new URL(reqC.url) },
			makeNext({ maxAge: 60, body: '/c-new' }),
		);
		assert.equal(resC.headers.get('X-Astro-Cache'), 'HIT');

		// /a should have been evicted (MISS) — check without caching the result
		// by using a next() that returns no cache headers
		const reqA = makeRequest('http://localhost/a');
		const resA = await provider.onRequest!(
			{ request: reqA, url: new URL(reqA.url) },
			makeNext({ body: '/a-evicted' }),
		);
		assert.equal(resA.headers.has('X-Astro-Cache'), false);
	});
});

// #endregion

// #region invalidate

describe('memory-provider invalidate', () => {
	it('invalidates by tag', async () => {
		const provider = createProvider();
		const url = 'http://localhost/page';

		// Cache an entry with tags
		const req1 = makeRequest(url);
		await provider.onRequest!(
			{ request: req1, url: new URL(req1.url) },
			makeNext({ maxAge: 60, tags: ['product'] }),
		);

		// Verify cached
		const req2 = makeRequest(url);
		const res2 = await provider.onRequest!(
			{ request: req2, url: new URL(req2.url) },
			makeNext({ maxAge: 60 }),
		);
		assert.equal(res2.headers.get('X-Astro-Cache'), 'HIT');

		// Invalidate
		await provider.invalidate({ tags: ['product'] });

		// Should be MISS now
		const req3 = makeRequest(url);
		const res3 = await provider.onRequest!(
			{ request: req3, url: new URL(req3.url) },
			makeNext({ maxAge: 60, body: 'fresh' }),
		);
		assert.equal(res3.headers.get('X-Astro-Cache'), 'MISS');
	});

	it('invalidates by path', async () => {
		const provider = createProvider();

		// Cache two entries
		for (const path of ['/a', '/b']) {
			const req = makeRequest(`http://localhost${path}`);
			await provider.onRequest!(
				{ request: req, url: new URL(req.url) },
				makeNext({ maxAge: 60, body: path }),
			);
		}

		// Invalidate only /a
		await provider.invalidate({ path: '/a' });

		// /a should miss
		const reqA = makeRequest('http://localhost/a');
		const resA = await provider.onRequest!(
			{ request: reqA, url: new URL(reqA.url) },
			makeNext({ maxAge: 60, body: 'a-new' }),
		);
		assert.equal(resA.headers.get('X-Astro-Cache'), 'MISS');

		// /b should still hit
		const reqB = makeRequest('http://localhost/b');
		const resB = await provider.onRequest!(
			{ request: reqB, url: new URL(reqB.url) },
			makeNext({ maxAge: 60, body: 'b-new' }),
		);
		assert.equal(resB.headers.get('X-Astro-Cache'), 'HIT');
	});

	it('invalidate with non-matching tag does not remove entries', async () => {
		const provider = createProvider();
		const url = 'http://localhost/page';

		const req1 = makeRequest(url);
		await provider.onRequest!(
			{ request: req1, url: new URL(req1.url) },
			makeNext({ maxAge: 60, tags: ['product'] }),
		);

		await provider.invalidate({ tags: ['blog'] });

		const req2 = makeRequest(url);
		const res2 = await provider.onRequest!(
			{ request: req2, url: new URL(req2.url) },
			makeNext({ maxAge: 60 }),
		);
		assert.equal(res2.headers.get('X-Astro-Cache'), 'HIT');
	});
});

// #endregion

// #region onRequest: SWR (stale-while-revalidate)

describe('memory-provider SWR', () => {
	it('serves STALE and triggers background revalidation', async () => {
		const provider = createProvider();
		const url = 'http://localhost/page';

		// Seed cache with maxAge=0 + swr=60 by manipulating storedAt.
		// We can't easily manipulate time, so use a very short maxAge.
		// Instead, seed with maxAge=1, swr=60, then wait briefly.
		const req1 = makeRequest(url);
		await provider.onRequest!(
			{ request: req1, url: new URL(req1.url) },
			makeNext({ maxAge: 1, swr: 60, body: 'stale-body' }),
		);

		// Wait for entry to become stale (just over 1 second)
		await new Promise((r) => setTimeout(r, 1100));

		// Second request should get STALE
		const req2 = makeRequest(url);
		const res2 = await provider.onRequest!(
			{ request: req2, url: new URL(req2.url) },
			makeNext({ maxAge: 60, swr: 60, body: 'fresh-body' }),
		);
		assert.equal(res2.headers.get('X-Astro-Cache'), 'STALE');
		assert.equal(await res2.text(), 'stale-body');

		// Give background revalidation time to complete
		await new Promise((r) => setTimeout(r, 100));

		// Third request should now get HIT with the fresh content
		const req3 = makeRequest(url);
		const res3 = await provider.onRequest!(
			{ request: req3, url: new URL(req3.url) },
			makeNext({ maxAge: 60, body: 'should-not-see' }),
		);
		assert.equal(res3.headers.get('X-Astro-Cache'), 'HIT');
		assert.equal(await res3.text(), 'fresh-body');
	});
});

// #endregion

// #region response body correctness

describe('memory-provider response body', () => {
	it('serves correct body from cache', async () => {
		const provider = createProvider();
		const url = 'http://localhost/page';
		const body = JSON.stringify({ data: [1, 2, 3], nested: { key: 'value' } });

		const req1 = makeRequest(url);
		await provider.onRequest!(
			{ request: req1, url: new URL(req1.url) },
			makeNext({ maxAge: 60, body }),
		);

		const req2 = makeRequest(url);
		const res2 = await provider.onRequest!(
			{ request: req2, url: new URL(req2.url) },
			makeNext({ maxAge: 60, body: 'wrong' }),
		);
		assert.equal(await res2.text(), body);
	});

	it('preserves response status code from cache', async () => {
		const provider = createProvider();
		const url = 'http://localhost/page';

		const req1 = makeRequest(url);
		await provider.onRequest!(
			{ request: req1, url: new URL(req1.url) },
			makeNext({ maxAge: 60, status: 201, body: 'created' }),
		);

		const req2 = makeRequest(url);
		const res2 = await provider.onRequest!(
			{ request: req2, url: new URL(req2.url) },
			makeNext({ maxAge: 60 }),
		);
		assert.equal(res2.status, 201);
	});

	it('preserves response headers from cache (except Set-Cookie)', async () => {
		const provider = createProvider();
		const url = 'http://localhost/page';

		const req1 = makeRequest(url);
		await provider.onRequest!(
			{ request: req1, url: new URL(req1.url) },
			makeNext({
				maxAge: 60,
				headers: { 'Content-Type': 'application/json', 'X-Custom': 'hello' },
			}),
		);

		const req2 = makeRequest(url);
		const res2 = await provider.onRequest!(
			{ request: req2, url: new URL(req2.url) },
			makeNext({ maxAge: 60 }),
		);
		assert.equal(res2.headers.get('Content-Type'), 'application/json');
		assert.equal(res2.headers.get('X-Custom'), 'hello');
	});
});

// #endregion
