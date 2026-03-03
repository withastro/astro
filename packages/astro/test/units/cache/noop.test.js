import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { NoopAstroCache, DisabledAstroCache } from '../../../dist/core/cache/runtime/noop.js';
import { applyCacheHeaders, isCacheActive } from '../../../dist/core/cache/runtime/cache.js';

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

	it('options returns frozen empty object', () => {
		const cache = new NoopAstroCache();
		const options = cache.options;
		assert.deepEqual(options.tags, []);
		assert.equal(Object.isFrozen(options), true);
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

describe('DisabledAstroCache', () => {
	it('set() throws AstroError with CacheNotEnabled', () => {
		const cache = new DisabledAstroCache();
		assert.throws(
			() => cache.set({ maxAge: 300 }),
			(err) => err.name === 'CacheNotEnabled',
		);
	});

	it('set(false) throws AstroError with CacheNotEnabled', () => {
		const cache = new DisabledAstroCache();
		assert.throws(
			() => cache.set(false),
			(err) => err.name === 'CacheNotEnabled',
		);
	});

	it('tags getter throws AstroError with CacheNotEnabled', () => {
		const cache = new DisabledAstroCache();
		assert.throws(
			() => cache.tags,
			(err) => err.name === 'CacheNotEnabled',
		);
	});

	it('options getter throws AstroError with CacheNotEnabled', () => {
		const cache = new DisabledAstroCache();
		assert.throws(
			() => cache.options,
			(err) => err.name === 'CacheNotEnabled',
		);
	});

	it('invalidate() throws AstroError with CacheNotEnabled', async () => {
		const cache = new DisabledAstroCache();
		await assert.rejects(
			() => cache.invalidate({ tags: 'x' }),
			(err) => err.name === 'CacheNotEnabled',
		);
	});

	it('applyCacheHeaders() no-ops for disabled cache', () => {
		const cache = new DisabledAstroCache();
		const response = new Response('test');
		applyCacheHeaders(cache, response);
		assert.equal(response.headers.get('CDN-Cache-Control'), null);
	});

	it('isCacheActive() returns false for disabled cache', () => {
		const cache = new DisabledAstroCache();
		assert.equal(isCacheActive(cache), false);
	});
});
