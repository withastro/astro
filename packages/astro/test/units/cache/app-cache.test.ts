import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import memoryProvider from '../../../dist/core/cache/memory-provider.js';
import { createEndpoint, createTestApp } from '../mocks.ts';
import type { APIContext } from '../../../dist/types/public/context.js';

function createCacheManifestOverrides() {
	return {
		cacheProvider: async () => ({ default: memoryProvider }),
		cacheConfig: { provider: 'memory' },
	};
}

// #region Route factories

function cachedEndpoint() {
	return createEndpoint(
		{
			GET: (ctx: APIContext) => {
				ctx.cache.set({ maxAge: 300, swr: 60, tags: ['data'] });
				return Response.json({ timestamp: Date.now() });
			},
		},
		{ route: '/cached' },
	);
}

function headCachedEndpoint() {
	return createEndpoint(
		{
			GET: (ctx: APIContext) => {
				ctx.cache.set({ maxAge: 300, tags: ['head-cached'] });
				return Response.json({ timestamp: Date.now() });
			},
		},
		{ route: '/head-cached' },
	);
}

function noCacheEndpoint() {
	return createEndpoint(
		{
			GET: () => Response.json({ timestamp: Date.now() }),
		},
		{ route: '/no-cache' },
	);
}

function optOutEndpoint() {
	return createEndpoint(
		{
			GET: (ctx: APIContext) => {
				ctx.cache.set(false);
				return Response.json({ timestamp: Date.now() });
			},
		},
		{ route: '/opt-out' },
	);
}

function withCookieEndpoint() {
	return createEndpoint(
		{
			GET: (ctx: APIContext) => {
				ctx.cache.set({ maxAge: 300, tags: ['cookie'] });
				const response = Response.json({ timestamp: Date.now(), nonce: Math.random() });
				response.headers.set('Set-Cookie', 'session=test; Path=/; HttpOnly');
				return response;
			},
		},
		{ route: '/with-cookie' },
	);
}

function invalidateEndpoint() {
	return createEndpoint(
		{
			POST: async (ctx: APIContext) => {
				await ctx.cache.invalidate({ tags: ['data'] });
				return Response.json({ invalidated: true });
			},
		},
		{ route: '/invalidate' },
	);
}

function invalidatePathEndpoint() {
	return createEndpoint(
		{
			POST: async (ctx: APIContext) => {
				await ctx.cache.invalidate({ path: '/cached' });
				return Response.json({ invalidated: true });
			},
		},
		{ route: '/invalidate-path' },
	);
}

function varyLangEndpoint() {
	return createEndpoint(
		{
			GET: (ctx: APIContext) => {
				const lang = ctx.request.headers.get('Accept-Language') || 'en';
				ctx.cache.set({ maxAge: 300, tags: ['vary-test'] });
				return new Response(JSON.stringify({ lang, timestamp: Date.now() }), {
					headers: {
						'Content-Type': 'application/json',
						Vary: 'Accept-Language',
					},
				});
			},
		},
		{ route: '/vary-lang' },
	);
}

// #endregion

// #region Tests

describe('context.cache through App pipeline', () => {
	it('does not cache HEAD requests', async () => {
		const overrides = createCacheManifestOverrides();
		const app = createTestApp([headCachedEndpoint()], overrides);

		const head = await app.render(new Request('http://localhost/head-cached', { method: 'HEAD' }));
		assert.equal(head.status, 200);
		assert.equal(head.headers.get('X-Astro-Cache'), null);

		const firstGet = await app.render(new Request('http://localhost/head-cached'));
		assert.equal(firstGet.headers.get('X-Astro-Cache'), 'MISS');

		const secondGet = await app.render(new Request('http://localhost/head-cached'));
		assert.equal(secondGet.headers.get('X-Astro-Cache'), 'HIT');
	});

	it('uses host-aware cache keys', async () => {
		const overrides = createCacheManifestOverrides();
		const app = createTestApp([cachedEndpoint()], overrides);

		const aFirst = await app.render(new Request('http://a.example/cached'));
		assert.equal(aFirst.headers.get('X-Astro-Cache'), 'MISS');

		const bFirst = await app.render(new Request('http://b.example/cached'));
		assert.equal(bFirst.headers.get('X-Astro-Cache'), 'MISS');

		const aSecond = await app.render(new Request('http://a.example/cached'));
		assert.equal(aSecond.headers.get('X-Astro-Cache'), 'HIT');

		const bSecond = await app.render(new Request('http://b.example/cached'));
		assert.equal(bSecond.headers.get('X-Astro-Cache'), 'HIT');
	});

	it('cached response is served on second request and internal headers are stripped', async () => {
		const overrides = createCacheManifestOverrides();
		const app = createTestApp([cachedEndpoint()], overrides);

		const first = await app.render(new Request('http://localhost/cached'));
		assert.equal(first.status, 200);
		const firstBody = await first.json();

		const second = await app.render(new Request('http://localhost/cached'));
		assert.equal(second.status, 200);
		const secondBody = await second.json();
		assert.equal(second.headers.get('X-Astro-Cache'), 'HIT');
		assert.equal(firstBody.timestamp, secondBody.timestamp, 'Cached body should match');

		// The HIT above proves CDN-Cache-Control/Cache-Tag were set internally
		// (the provider can only cache if it reads those headers). Verify they
		// are stripped from the final response so end-users never see them.
		assert.equal(second.headers.get('CDN-Cache-Control'), null);
		assert.equal(second.headers.get('Cache-Tag'), null);
	});

	it('uncached route passes through without cache headers', async () => {
		const overrides = createCacheManifestOverrides();
		const app = createTestApp([noCacheEndpoint()], overrides);

		const response = await app.render(new Request('http://localhost/no-cache'));
		assert.equal(response.status, 200);
		assert.equal(response.headers.get('X-Astro-Cache'), null);
	});

	it('cache.invalidate({ tags }) removes matching entries', async () => {
		const overrides = createCacheManifestOverrides();
		const app = createTestApp([cachedEndpoint(), invalidateEndpoint()], overrides);

		// Prime and verify cache
		await app.render(new Request('http://localhost/cached'));
		const hit = await app.render(new Request('http://localhost/cached'));
		assert.equal(hit.headers.get('X-Astro-Cache'), 'HIT');

		// Invalidate by tag
		const inv = await app.render(
			new Request('http://localhost/invalidate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			}),
		);
		assert.equal(inv.status, 200);

		// Should be a miss now
		const after = await app.render(new Request('http://localhost/cached'));
		assert.equal(after.headers.get('X-Astro-Cache'), 'MISS');
	});

	it('cache.invalidate({ path }) removes matching entry', async () => {
		const overrides = createCacheManifestOverrides();
		const app = createTestApp([cachedEndpoint(), invalidatePathEndpoint()], overrides);

		// Prime and verify cache
		await app.render(new Request('http://localhost/cached'));
		const hit = await app.render(new Request('http://localhost/cached'));
		assert.equal(hit.headers.get('X-Astro-Cache'), 'HIT');

		// Invalidate by path
		const inv = await app.render(
			new Request('http://localhost/invalidate-path', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			}),
		);
		assert.equal(inv.status, 200);

		// Should be a miss now
		const after = await app.render(new Request('http://localhost/cached'));
		assert.equal(after.headers.get('X-Astro-Cache'), 'MISS');
	});

	it('cache.set(false) opts out — no caching', async () => {
		const overrides = createCacheManifestOverrides();
		const app = createTestApp([optOutEndpoint()], overrides);

		const response = await app.render(new Request('http://localhost/opt-out'));
		assert.equal(response.status, 200);
		assert.equal(response.headers.get('X-Astro-Cache'), null);
	});

	it('response body is correctly served from cache', async () => {
		const overrides = createCacheManifestOverrides();
		const app = createTestApp([cachedEndpoint()], overrides);

		const first = await app.render(new Request('http://localhost/cached'));
		const firstBody = await first.json();
		assert.ok(firstBody.timestamp);

		const second = await app.render(new Request('http://localhost/cached'));
		const secondBody = await second.json();
		assert.deepEqual(firstBody, secondBody);
	});

	it('does not cache responses that include Set-Cookie', async () => {
		const overrides = createCacheManifestOverrides();
		const app = createTestApp([withCookieEndpoint()], overrides);

		const first = await app.render(new Request('http://localhost/with-cookie'));
		assert.equal(first.status, 200);
		assert.equal(first.headers.get('X-Astro-Cache'), null);
		assert.ok(first.headers.get('Set-Cookie'));
		const firstBody = await first.json();

		const second = await app.render(new Request('http://localhost/with-cookie'));
		assert.equal(second.status, 200);
		assert.equal(second.headers.get('X-Astro-Cache'), null);
		assert.ok(second.headers.get('Set-Cookie'));
		const secondBody = await second.json();

		assert.notEqual(firstBody.nonce, secondBody.nonce);
	});

	it('normalizes query parameter order (sorting)', async () => {
		const overrides = createCacheManifestOverrides();
		const app = createTestApp([cachedEndpoint()], overrides);

		// Prime cache with one param order
		const first = await app.render(new Request('http://localhost/cached?b=2&a=1'));
		assert.equal(first.headers.get('X-Astro-Cache'), 'MISS');

		// Same params, different order — should be a HIT
		const second = await app.render(new Request('http://localhost/cached?a=1&b=2'));
		assert.equal(second.headers.get('X-Astro-Cache'), 'HIT');
	});

	it('varies cache by Vary response header', async () => {
		const overrides = createCacheManifestOverrides();
		const app = createTestApp([varyLangEndpoint()], overrides);

		// Request with Accept-Language: en
		const enFirst = await app.render(
			new Request('http://localhost/vary-lang', {
				headers: { 'Accept-Language': 'en' },
			}),
		);
		assert.equal(enFirst.headers.get('X-Astro-Cache'), 'MISS');
		const enBody = await enFirst.json();
		assert.equal(enBody.lang, 'en');

		// Same URL, same language — should be a HIT
		const enSecond = await app.render(
			new Request('http://localhost/vary-lang', {
				headers: { 'Accept-Language': 'en' },
			}),
		);
		assert.equal(enSecond.headers.get('X-Astro-Cache'), 'HIT');

		// Same URL, different language — should be a MISS
		const frFirst = await app.render(
			new Request('http://localhost/vary-lang', {
				headers: { 'Accept-Language': 'fr' },
			}),
		);
		assert.equal(frFirst.headers.get('X-Astro-Cache'), 'MISS');
		const frBody = await frFirst.json();
		assert.equal(frBody.lang, 'fr');

		// Verify both variants are cached independently
		const enThird = await app.render(
			new Request('http://localhost/vary-lang', {
				headers: { 'Accept-Language': 'en' },
			}),
		);
		assert.equal(enThird.headers.get('X-Astro-Cache'), 'HIT');

		const frSecond = await app.render(
			new Request('http://localhost/vary-lang', {
				headers: { 'Accept-Language': 'fr' },
			}),
		);
		assert.equal(frSecond.headers.get('X-Astro-Cache'), 'HIT');
	});
});
