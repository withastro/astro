import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('context.cache', () => {
	describe('Production (CDN-style provider)', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;
		/** @type {import('../src/core/app/index').App} */
		let app;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/cache-route/',
				output: 'server',
				adapter: testAdapter(),
				experimental: {
					cache: {
						driver: fileURLToPath(
							new URL('./fixtures/cache-route/mock-cache-driver.mjs', import.meta.url),
						),
						routes: {
							'/config-route': { maxAge: 600, tags: ['config'] },
						},
					},
				},
			});
			await fixture.build({});
			app = await fixture.loadTestAdapterApp();
		});

		async function fetchResponse(path) {
			const request = new Request('http://example.com' + path);
			const response = await app.render(request);
			return response;
		}

		it('sets CDN-Cache-Control and Cache-Tag headers from context.cache.set()', async () => {
			const response = await fetchResponse('/api');
			assert.equal(response.status, 200);
			const cacheControl = response.headers.get('CDN-Cache-Control');
			assert.ok(cacheControl, 'CDN-Cache-Control header should be present');
			assert.ok(cacheControl.includes('max-age=300'), `Expected max-age=300, got: ${cacheControl}`);
			assert.ok(
				cacheControl.includes('stale-while-revalidate=60'),
				`Expected stale-while-revalidate=60, got: ${cacheControl}`,
			);
			const cacheTag = response.headers.get('Cache-Tag');
			assert.ok(cacheTag, 'Cache-Tag header should be present');
			assert.ok(cacheTag.includes('api'), `Expected 'api' in Cache-Tag, got: ${cacheTag}`);
			assert.ok(cacheTag.includes('data'), `Expected 'data' in Cache-Tag, got: ${cacheTag}`);
		});

		it('produces no cache headers when cache.set(false)', async () => {
			const response = await fetchResponse('/no-cache');
			assert.equal(response.status, 200);
			assert.equal(response.headers.get('CDN-Cache-Control'), null);
			assert.equal(response.headers.get('Cache-Tag'), null);
		});

		it('produces Cache-Tag but no CDN-Cache-Control for tags-only', async () => {
			const response = await fetchResponse('/tags-only');
			assert.equal(response.status, 200);
			assert.equal(
				response.headers.get('CDN-Cache-Control'),
				null,
				'CDN-Cache-Control should not be set for tags-only',
			);
			const cacheTag = response.headers.get('Cache-Tag');
			assert.ok(cacheTag, 'Cache-Tag header should be present');
			assert.ok(cacheTag.includes('product'), `Expected 'product' tag, got: ${cacheTag}`);
			assert.ok(cacheTag.includes('sku-123'), `Expected 'sku-123' tag, got: ${cacheTag}`);
		});

		it('applies config-level route cache options automatically', async () => {
			const response = await fetchResponse('/config-route');
			assert.equal(response.status, 200);
			const cacheControl = response.headers.get('CDN-Cache-Control');
			assert.ok(cacheControl, 'CDN-Cache-Control header should be present from config');
			assert.ok(cacheControl.includes('max-age=600'), `Expected max-age=600, got: ${cacheControl}`);
			const cacheTag = response.headers.get('Cache-Tag');
			assert.ok(cacheTag, 'Cache-Tag header should be present from config');
			assert.ok(cacheTag.includes('config'), `Expected 'config' tag, got: ${cacheTag}`);
		});

		it('sets cache headers on .astro pages via Astro.cache', async () => {
			const response = await fetchResponse('/');
			assert.equal(response.status, 200);
			const cacheControl = response.headers.get('CDN-Cache-Control');
			assert.ok(cacheControl, 'CDN-Cache-Control should be set on .astro page');
			assert.ok(cacheControl.includes('max-age=120'), `Expected max-age=120, got: ${cacheControl}`);
			const cacheTag = response.headers.get('Cache-Tag');
			assert.ok(cacheTag, 'Cache-Tag should be set on .astro page');
			assert.ok(cacheTag.includes('home'), `Expected 'home' tag, got: ${cacheTag}`);
		});

		it('response body is correct JSON from API route', async () => {
			const response = await fetchResponse('/api');
			const body = await response.json();
			assert.deepEqual(body, { ok: true });
		});
	});
});
