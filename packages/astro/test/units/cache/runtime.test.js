import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AstroCache } from '../../../dist/core/cache/runtime.js';

// Mock provider
function createMockProvider(overrides = {}) {
	return {
		name: 'test-provider',
		invalidate: async () => {},
		...overrides,
	};
}

describe('AstroCache - set() with CacheOptions', () => {
	it('sets maxAge, swr, tags, lastModified, etag', () => {
		const cache = new AstroCache(null);
		const lastModified = new Date('2025-01-01');
		cache.set({ maxAge: 300, swr: 60, tags: ['a', 'b'], lastModified, etag: '"abc"' });

		assert.equal(cache._isActive, true);
		assert.deepEqual(cache.tags, ['a', 'b']);
	});

	it('sets maxAge only', () => {
		const cache = new AstroCache(null);
		cache.set({ maxAge: 600 });
		assert.equal(cache._isActive, true);
	});

	it('sets tags only', () => {
		const cache = new AstroCache(null);
		cache.set({ tags: ['product'] });
		assert.equal(cache._isActive, true);
		assert.deepEqual(cache.tags, ['product']);
	});
});

describe('AstroCache - set() with CacheHint', () => {
	it('extracts tags and lastModified from CacheHint', () => {
		const cache = new AstroCache(null);
		cache.set({ tags: ['post'], lastModified: new Date('2025-06-01') });
		assert.deepEqual(cache.tags, ['post']);
		assert.equal(cache._isActive, true);
	});
});

describe('AstroCache - set() with LiveDataEntry', () => {
	it('extracts cacheHint from LiveDataEntry', () => {
		const cache = new AstroCache(null);
		cache.set({
			id: 'entry-1',
			data: { title: 'Test' },
			cacheHint: { tags: ['entry'], lastModified: new Date('2025-03-15') },
		});
		assert.deepEqual(cache.tags, ['entry']);
		assert.equal(cache._isActive, true);
	});

	it('no-ops when LiveDataEntry has no cacheHint', () => {
		const cache = new AstroCache(null);
		cache.set({ id: 'entry-2', data: { title: 'Test' }, cacheHint: undefined });
		assert.equal(cache._isActive, false);
		assert.deepEqual(cache.tags, []);
	});
});

describe('AstroCache - set(false)', () => {
	it('disables and clears everything', () => {
		const cache = new AstroCache(null);
		cache.set({ maxAge: 300, tags: ['a'] });
		cache.set(false);
		assert.equal(cache._isActive, false);
		assert.deepEqual(cache.tags, []);
	});
});

describe('AstroCache - multiple set() calls', () => {
	it('scalar last-write-wins for maxAge and swr', () => {
		const cache = new AstroCache(null);
		cache.set({ maxAge: 100, swr: 10 });
		cache.set({ maxAge: 200, swr: 20 });

		// Verify via _applyHeaders
		const response = new Response('test');
		cache._applyHeaders(response);
		assert.equal(
			response.headers.get('CDN-Cache-Control'),
			'max-age=200, stale-while-revalidate=20',
		);
	});

	it('lastModified most-recent-wins (not last-write)', () => {
		const cache = new AstroCache(null);
		const newer = new Date('2025-06-01');
		const older = new Date('2025-01-01');

		cache.set({ maxAge: 60, lastModified: newer });
		cache.set({ maxAge: 60, lastModified: older }); // older date written last — should NOT win

		const response = new Response('test');
		cache._applyHeaders(response);
		assert.equal(response.headers.get('Last-Modified'), newer.toUTCString());
	});

	it('tags accumulate and deduplicate', () => {
		const cache = new AstroCache(null);
		cache.set({ tags: ['a', 'b'] });
		cache.set({ tags: ['b', 'c'] });
		assert.deepEqual(cache.tags, ['a', 'b', 'c']);
	});

	it('set(false) after other calls clears everything', () => {
		const cache = new AstroCache(null);
		cache.set({ maxAge: 300, tags: ['x'] });
		cache.set(false);
		assert.equal(cache._isActive, false);
		assert.deepEqual(cache.tags, []);

		const response = new Response('test');
		cache._applyHeaders(response);
		assert.equal(response.headers.get('CDN-Cache-Control'), null);
	});

	it('set() after set(false) re-enables', () => {
		const cache = new AstroCache(null);
		cache.set({ maxAge: 300 });
		cache.set(false);
		cache.set({ maxAge: 600 });
		assert.equal(cache._isActive, true);

		const response = new Response('test');
		cache._applyHeaders(response);
		assert.equal(response.headers.get('CDN-Cache-Control'), 'max-age=600');
	});
});

describe('AstroCache - tags getter', () => {
	it('returns a copy — mutations do not affect internal state', () => {
		const cache = new AstroCache(null);
		cache.set({ tags: ['a', 'b'] });

		const tags = cache.tags;
		tags.push('c');

		assert.deepEqual(cache.tags, ['a', 'b']);
	});
});

describe('AstroCache - invalidate()', () => {
	it('calls provider.invalidate() with correct options', async () => {
		let captured;
		const provider = createMockProvider({
			invalidate: async (opts) => {
				captured = opts;
			},
		});
		const cache = new AstroCache(provider);
		await cache.invalidate({ tags: ['product'], path: '/products' });
		assert.deepEqual(captured, { tags: ['product'], path: '/products' });
	});

	it('extracts tags from LiveDataEntry for invalidate', async () => {
		let captured;
		const provider = createMockProvider({
			invalidate: async (opts) => {
				captured = opts;
			},
		});
		const cache = new AstroCache(provider);
		await cache.invalidate({
			id: 'entry-1',
			data: {},
			cacheHint: { tags: ['blog'] },
		});
		assert.deepEqual(captured, { tags: ['blog'] });
	});

	it('throws without provider', async () => {
		const cache = new AstroCache(null);
		await assert.rejects(() => cache.invalidate({ tags: 'x' }), {
			message: 'Cache invalidation requires a cache provider',
		});
	});
});

describe('AstroCache - _applyHeaders()', () => {
	it('generates correct CDN-Cache-Control', () => {
		const cache = new AstroCache(null);
		cache.set({ maxAge: 300 });

		const response = new Response('test');
		cache._applyHeaders(response);
		assert.equal(response.headers.get('CDN-Cache-Control'), 'max-age=300');
	});

	it('generates CDN-Cache-Control with swr', () => {
		const cache = new AstroCache(null);
		cache.set({ maxAge: 300, swr: 60 });

		const response = new Response('test');
		cache._applyHeaders(response);
		assert.equal(
			response.headers.get('CDN-Cache-Control'),
			'max-age=300, stale-while-revalidate=60',
		);
	});

	it('generates correct Cache-Tag', () => {
		const cache = new AstroCache(null);
		cache.set({ maxAge: 60, tags: ['product', 'featured'] });

		const response = new Response('test');
		cache._applyHeaders(response);
		assert.equal(response.headers.get('Cache-Tag'), 'product, featured');
	});

	it('generates correct Last-Modified and ETag', () => {
		const cache = new AstroCache(null);
		const date = new Date('2025-06-01T12:00:00Z');
		cache.set({ maxAge: 60, lastModified: date, etag: '"v1"' });

		const response = new Response('test');
		cache._applyHeaders(response);
		assert.equal(response.headers.get('Last-Modified'), date.toUTCString());
		assert.equal(response.headers.get('ETag'), '"v1"');
	});

	it('uses provider.setHeaders() when available', () => {
		const customHeaders = new Headers({ 'X-Custom-Cache': 'hit' });
		const provider = createMockProvider({
			setHeaders: () => customHeaders,
		});
		const cache = new AstroCache(provider);
		cache.set({ maxAge: 60 });

		const response = new Response('test');
		cache._applyHeaders(response);
		assert.equal(response.headers.get('X-Custom-Cache'), 'hit');
	});

	it('skips when disabled', () => {
		const cache = new AstroCache(null);
		cache.set({ maxAge: 300, tags: ['a'] });
		cache.set(false);

		const response = new Response('test');
		cache._applyHeaders(response);
		assert.equal(response.headers.get('CDN-Cache-Control'), null);
		assert.equal(response.headers.get('Cache-Tag'), null);
	});

	it('skips when nothing was set', () => {
		const cache = new AstroCache(null);

		const response = new Response('test');
		cache._applyHeaders(response);
		assert.equal(response.headers.get('CDN-Cache-Control'), null);
	});
});

describe('AstroCache - _isActive', () => {
	it('false initially', () => {
		const cache = new AstroCache(null);
		assert.equal(cache._isActive, false);
	});

	it('true after setting maxAge', () => {
		const cache = new AstroCache(null);
		cache.set({ maxAge: 60 });
		assert.equal(cache._isActive, true);
	});

	it('true after setting tags', () => {
		const cache = new AstroCache(null);
		cache.set({ tags: ['a'] });
		assert.equal(cache._isActive, true);
	});

	it('false after set(false)', () => {
		const cache = new AstroCache(null);
		cache.set({ maxAge: 60 });
		cache.set(false);
		assert.equal(cache._isActive, false);
	});
});
