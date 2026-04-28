import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { NoopAstroCache, DisabledAstroCache } from '../../../dist/core/cache/runtime/noop.js';
import { applyCacheHeaders, isCacheActive } from '../../../dist/core/cache/runtime/cache.js';
import { defaultLogger } from '../test-utils.ts';

describe('NoopAstroCache', () => {
	it('enabled is false', () => {
		const cache = new NoopAstroCache();
		assert.ok(!cache.enabled);
	});

	it('set() is callable and does nothing', () => {
		const cache = new NoopAstroCache();
		cache.set();
		cache.set();
		// No error thrown
	});

	it('tags returns empty array', () => {
		const cache = new NoopAstroCache();
		assert.deepEqual(cache.tags, []);
	});

	it('invalidate() is callable and resolves', async () => {
		const cache = new NoopAstroCache();
		await cache.invalidate();
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
	it('enabled is false', () => {
		const cache = new DisabledAstroCache(defaultLogger);
		assert.equal(cache.enabled, false);
	});

	it('set() does not throw', () => {
		const cache = new DisabledAstroCache(defaultLogger);
		cache.set();
		cache.set();
		// No error thrown
	});

	it('tags returns empty array', () => {
		const cache = new DisabledAstroCache(defaultLogger);
		cache.set();
		assert.deepEqual(cache.tags, []);
	});

	it('options returns empty object with empty tags', () => {
		const cache = new DisabledAstroCache(defaultLogger);
		const options = cache.options;
		assert.deepEqual(options.tags, []);
	});

	it('invalidate() throws AstroError with CacheNotEnabled', async () => {
		const cache = new DisabledAstroCache(defaultLogger);
		await assert.rejects(
			() => cache.invalidate(),
			(err: Error) => err.name === 'CacheNotEnabled',
		);
	});

	it('applyCacheHeaders() no-ops for disabled cache', () => {
		const cache = new DisabledAstroCache(defaultLogger);
		const response = new Response('test');
		applyCacheHeaders(cache, response);
		assert.equal(response.headers.get('CDN-Cache-Control'), null);
	});

	it('isCacheActive() returns false for disabled cache', () => {
		const cache = new DisabledAstroCache(defaultLogger);
		assert.equal(isCacheActive(cache), false);
	});
});
