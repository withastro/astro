import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('Memory cache provider', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	/** @type {import('astro/app').App} */
	let app;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/cache-memory/',
			output: 'server',
			adapter: testAdapter(),
		});
		await fixture.build({});
		app = await fixture.loadTestAdapterApp();
	});

	async function renderRequest(path, options) {
		const request = new Request('http://example.com' + path, options);
		return app.render(request);
	}

	it('cached response is served on second request (cache hit)', async () => {
		const first = await renderRequest('/cached');
		assert.equal(first.status, 200);
		const firstBody = await first.json();

		const second = await renderRequest('/cached');
		assert.equal(second.status, 200);
		const secondBody = await second.json();
		assert.equal(second.headers.get('X-Astro-Cache'), 'HIT');
		assert.equal(firstBody.timestamp, secondBody.timestamp, 'Cached body should match');
	});

	it('uncached route passes through without cache headers', async () => {
		const response = await renderRequest('/no-cache');
		assert.equal(response.status, 200);
		assert.equal(response.headers.get('X-Astro-Cache'), null);
	});

	it('CDN-Cache-Control and Cache-Tag headers are stripped from response', async () => {
		const response = await renderRequest('/cached');
		assert.equal(response.status, 200);
		assert.equal(response.headers.get('CDN-Cache-Control'), null);
		assert.equal(response.headers.get('Cache-Tag'), null);
	});

	it('cache.invalidate({ tags }) removes matching entries', async () => {
		// Prime and verify cache
		await renderRequest('/cached');
		const hit = await renderRequest('/cached');
		assert.equal(hit.headers.get('X-Astro-Cache'), 'HIT');

		// Invalidate by tag
		const inv = await renderRequest('/invalidate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
		});
		assert.equal(inv.status, 200);

		// Should be a miss now
		const after = await renderRequest('/cached');
		assert.equal(after.headers.get('X-Astro-Cache'), 'MISS');
	});

	it('cache.invalidate({ path }) removes matching entry', async () => {
		// Prime and verify cache
		await renderRequest('/cached');
		const hit = await renderRequest('/cached');
		assert.equal(hit.headers.get('X-Astro-Cache'), 'HIT');

		// Invalidate by path
		const inv = await renderRequest('/invalidate-path', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
		});
		assert.equal(inv.status, 200);

		// Should be a miss now
		const after = await renderRequest('/cached');
		assert.equal(after.headers.get('X-Astro-Cache'), 'MISS');
	});

	it('cache.set(false) opts out — no caching', async () => {
		const response = await renderRequest('/opt-out');
		assert.equal(response.status, 200);
		assert.equal(response.headers.get('X-Astro-Cache'), null);
	});

	it('response body is correctly served from cache', async () => {
		const first = await renderRequest('/cached');
		const firstBody = await first.json();
		assert.ok(firstBody.timestamp);

		const second = await renderRequest('/cached');
		const secondBody = await second.json();
		assert.deepEqual(firstBody, secondBody);
	});
});
