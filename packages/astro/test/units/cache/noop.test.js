import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { NoopAstroCache } from '../../../dist/core/cache/noop.js';

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

	it('_applyHeaders() is callable and does nothing', () => {
		const cache = new NoopAstroCache();
		const response = new Response('test');
		cache._applyHeaders(response);
		assert.equal(response.headers.get('CDN-Cache-Control'), null);
		assert.equal(response.headers.get('Cache-Tag'), null);
	});

	it('_isActive returns false', () => {
		const cache = new NoopAstroCache();
		assert.equal(cache._isActive, false);
	});
});
