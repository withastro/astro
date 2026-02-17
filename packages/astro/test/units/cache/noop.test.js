import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { NoopAstroCache, disabledAstroCache } from '../../../dist/core/cache/noop.js';
import { applyCacheHeaders, isCacheActive } from '../../../dist/core/cache/runtime.js';

describe('NoopAstroCache', () => {
	it('set() is callable and does nothing', () => {
		const cache = new NoopAstroCache();
		cache.set({ maxAge: 300, tags: ['a'] });
		cache.set(false);
		// No error thrown
	});

	it('tags returns empty array', () => {
		const cache = new NoopAstroCache();
		assert.deepEqual(cache.tags, []);
	});

	it('invalidate() is callable and resolves', async () => {
		const cache = new NoopAstroCache();
		await cache.invalidate({ tags: 'x' });
		// No error thrown
	});

	it('applyCacheHeaders() no-ops for noop cache', () => {
		const cache = new NoopAstroCache();
		const response = new Response('test');
		applyCacheHeaders(cache, response);
		assert.equal(response.headers.get('CDN-Cache-Control'), null);
		assert.equal(response.headers.get('Cache-Tag'), null);
	});

	it('isCacheActive() returns false for noop cache', () => {
		const cache = new NoopAstroCache();
		assert.equal(isCacheActive(cache), false);
	});
});

describe('disabledAstroCache (singleton)', () => {
	it('set() throws AstroError with CacheNotEnabled', () => {
		assert.throws(
			() => disabledAstroCache.set({ maxAge: 300 }),
			(err) => err.name === 'CacheNotEnabled',
		);
	});

	it('set(false) throws AstroError with CacheNotEnabled', () => {
		assert.throws(
			() => disabledAstroCache.set(false),
			(err) => err.name === 'CacheNotEnabled',
		);
	});

	it('tags getter throws AstroError with CacheNotEnabled', () => {
		assert.throws(
			() => disabledAstroCache.tags,
			(err) => err.name === 'CacheNotEnabled',
		);
	});

	it('invalidate() throws AstroError with CacheNotEnabled', async () => {
		await assert.rejects(
			() => disabledAstroCache.invalidate({ tags: 'x' }),
			(err) => err.name === 'CacheNotEnabled',
		);
	});

	it('applyCacheHeaders() no-ops for disabled cache', () => {
		const response = new Response('test');
		applyCacheHeaders(disabledAstroCache, response);
		assert.equal(response.headers.get('CDN-Cache-Control'), null);
	});

	it('isCacheActive() returns false for disabled cache', () => {
		assert.equal(isCacheActive(disabledAstroCache), false);
	});
});
