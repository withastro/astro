import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import testAdapter from './test-adapter.ts';
import { type App, type Fixture, loadFixture } from './test-utils.ts';

describe('Memory cache provider', () => {
	let fixture: Fixture;
	let app: App;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/cache-memory/',
			output: 'server',
			adapter: testAdapter(),
			outDir: './dist/cache-memory/',
		});
		await fixture.build({});
		app = await fixture.loadTestAdapterApp();
	});

	async function renderRequest(path: string, options?: RequestInit) {
		const request = new Request('http://example.com' + path, options);
		return app.render(request);
	}

	it('does not cache HEAD requests', async () => {
		const head = await renderRequest('/head-cached', { method: 'HEAD' });
		assert.equal(head.status, 200);
		assert.equal(head.headers.get('X-Astro-Cache'), null);

		const firstGet = await renderRequest('/head-cached');
		assert.equal(firstGet.headers.get('X-Astro-Cache'), 'MISS');

		const secondGet = await renderRequest('/head-cached');
		assert.equal(secondGet.headers.get('X-Astro-Cache'), 'HIT');
	});

	it('uses host-aware cache keys', async () => {
		const aFirst = await app.render(new Request('http://a.example/cached'));
		assert.equal(aFirst.headers.get('X-Astro-Cache'), 'MISS');

		const bFirst = await app.render(new Request('http://b.example/cached'));
		assert.equal(bFirst.headers.get('X-Astro-Cache'), 'MISS');

		const aSecond = await app.render(new Request('http://a.example/cached'));
		assert.equal(aSecond.headers.get('X-Astro-Cache'), 'HIT');

		const bSecond = await app.render(new Request('http://b.example/cached'));
		assert.equal(bSecond.headers.get('X-Astro-Cache'), 'HIT');
	});

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

	it('does not cache responses that include Set-Cookie', async () => {
		const first = await renderRequest('/with-cookie');
		assert.equal(first.status, 200);
		assert.equal(first.headers.get('X-Astro-Cache'), null);
		assert.ok(first.headers.get('Set-Cookie'));
		const firstBody = await first.json();

		const second = await renderRequest('/with-cookie');
		assert.equal(second.status, 200);
		assert.equal(second.headers.get('X-Astro-Cache'), null);
		assert.ok(second.headers.get('Set-Cookie'));
		const secondBody = await second.json();

		assert.notEqual(firstBody.nonce, secondBody.nonce);
	});

	it('normalizes query parameter order (sorting)', async () => {
		// Prime cache with one param order
		const first = await renderRequest('/cached?b=2&a=1');
		assert.equal(first.headers.get('X-Astro-Cache'), 'MISS');

		// Same params, different order — should be a HIT
		const second = await renderRequest('/cached?a=1&b=2');
		assert.equal(second.headers.get('X-Astro-Cache'), 'HIT');
	});

	it('varies cache by Vary response header', async () => {
		// Request with Accept-Language: en
		const enFirst = await app.render(
			new Request('http://example.com/vary-lang', {
				headers: { 'Accept-Language': 'en' },
			}),
		);
		assert.equal(enFirst.headers.get('X-Astro-Cache'), 'MISS');
		const enBody = await enFirst.json();
		assert.equal(enBody.lang, 'en');

		// Same URL, same language — should be a HIT
		const enSecond = await app.render(
			new Request('http://example.com/vary-lang', {
				headers: { 'Accept-Language': 'en' },
			}),
		);
		assert.equal(enSecond.headers.get('X-Astro-Cache'), 'HIT');

		// Same URL, different language — should be a MISS (different Vary key)
		const frFirst = await app.render(
			new Request('http://example.com/vary-lang', {
				headers: { 'Accept-Language': 'fr' },
			}),
		);
		assert.equal(frFirst.headers.get('X-Astro-Cache'), 'MISS');
		const frBody = await frFirst.json();
		assert.equal(frBody.lang, 'fr');

		// Verify both variants are now cached independently
		const enThird = await app.render(
			new Request('http://example.com/vary-lang', {
				headers: { 'Accept-Language': 'en' },
			}),
		);
		assert.equal(enThird.headers.get('X-Astro-Cache'), 'HIT');

		const frSecond = await app.render(
			new Request('http://example.com/vary-lang', {
				headers: { 'Accept-Language': 'fr' },
			}),
		);
		assert.equal(frSecond.headers.get('X-Astro-Cache'), 'HIT');
	});
});
