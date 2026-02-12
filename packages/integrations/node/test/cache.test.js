// @ts-check
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import nodejs from '../dist/index.js';
import { loadFixture } from './test-utils.js';

describe('Route Caching (Node adapter)', () => {
	describe('Production', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;
		/** @type {import('../../../astro/src/types/public/preview.js').PreviewServer} */
		let previewServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/cache/',
				output: 'server',
				adapter: nodejs({ mode: 'middleware' }),
				experimental: {
					cache: {},
				},
			});
			await fixture.build({});
			previewServer = await fixture.preview({});
		});

		after(async () => {
			await previewServer.stop();
		});

		it('default driver is set when user does not configure one', async () => {
			// The adapter should have set @astrojs/node/cache as the default driver.
			// If it didn't, the cache would be a no-op and no X-Astro-Cache header would appear.
			const response = await fixture.fetch('/cached');
			assert.equal(response.status, 200);
			const cacheHeader = response.headers.get('x-astro-cache');
			assert.equal(cacheHeader, 'MISS', 'First request should be a cache MISS');
		});

		it('cached response is served on second request (cache hit)', async () => {
			// First request — cache miss (or already primed from prior test)
			const first = await fixture.fetch('/cached');
			assert.equal(first.status, 200);
			const firstBody = await first.json();

			// Second request — cache hit
			const second = await fixture.fetch('/cached');
			assert.equal(second.status, 200);
			const secondBody = await second.json();
			const cacheHeader = second.headers.get('x-astro-cache');
			assert.equal(cacheHeader, 'HIT', 'Second request should be a cache HIT');
			// The timestamp should be the same (served from cache)
			assert.equal(firstBody.timestamp, secondBody.timestamp, 'Cached body should match');
		});

		it('uncached route passes through without cache headers', async () => {
			const response = await fixture.fetch('/no-cache');
			assert.equal(response.status, 200);
			const cacheHeader = response.headers.get('x-astro-cache');
			assert.equal(cacheHeader, null, 'No X-Astro-Cache header for uncached routes');
		});

		it('CDN-Cache-Control and Cache-Tag headers are stripped from client response', async () => {
			const response = await fixture.fetch('/cached');
			assert.equal(response.status, 200);
			assert.equal(
				response.headers.get('cdn-cache-control'),
				null,
				'CDN-Cache-Control should be stripped for runtime providers',
			);
			assert.equal(
				response.headers.get('cache-tag'),
				null,
				'Cache-Tag should be stripped for runtime providers',
			);
		});

		it('cache.invalidate({ tags }) removes matching entries', async () => {
			// Ensure the entry is cached
			await fixture.fetch('/cached');
			const hit = await fixture.fetch('/cached');
			assert.equal(hit.headers.get('x-astro-cache'), 'HIT');

			// Invalidate by tag (Content-Type: application/json bypasses CSRF origin check)
			const invalidateResponse = await fixture.fetch('/invalidate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			});
			assert.equal(invalidateResponse.status, 200);

			// Next request should be a cache miss
			const afterInvalidate = await fixture.fetch('/cached');
			assert.equal(
				afterInvalidate.headers.get('x-astro-cache'),
				'MISS',
				'Should be MISS after tag invalidation',
			);
		});

		it('cache.invalidate({ path }) removes matching entry', async () => {
			// Ensure the entry is cached
			await fixture.fetch('/cached');
			const hit = await fixture.fetch('/cached');
			assert.equal(hit.headers.get('x-astro-cache'), 'HIT');

			// Invalidate by path (Content-Type: application/json bypasses CSRF origin check)
			const invalidateResponse = await fixture.fetch('/invalidate-path', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			});
			assert.equal(invalidateResponse.status, 200);

			// Next request should be a cache miss
			const afterInvalidate = await fixture.fetch('/cached');
			assert.equal(
				afterInvalidate.headers.get('x-astro-cache'),
				'MISS',
				'Should be MISS after path invalidation',
			);
		});

		it('cache.set(false) opts out — no caching', async () => {
			const first = await fixture.fetch('/opt-out');
			assert.equal(first.status, 200);
			const cacheHeader = first.headers.get('x-astro-cache');
			assert.equal(cacheHeader, null, 'Opted-out routes should not have X-Astro-Cache header');
		});

		it('response body is correctly served from cache', async () => {
			// Prime the cache
			const first = await fixture.fetch('/cached');
			const firstBody = await first.json();
			assert.ok(firstBody.timestamp, 'Response should have a timestamp');

			// Serve from cache
			const second = await fixture.fetch('/cached');
			const secondBody = await second.json();
			assert.deepEqual(firstBody, secondBody, 'Cached response body should match original');
		});
	});
});
