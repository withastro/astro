import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import testAdapter from './test-adapter.ts';
import { type App, type Fixture, loadFixture } from './test-utils.ts';

describe('Memory cache provider — default query exclusions', () => {
	let fixture: Fixture;
	let app: App;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/cache-memory-query/',
			output: 'server',
			adapter: testAdapter(),
			outDir: './dist/cache-memory-query-memory-cache-provider-default-query-excl/',
		});
		await fixture.build({});
		app = await fixture.loadTestAdapterApp();
	});

	async function renderRequest(path: string, options?: RequestInit) {
		const request = new Request('http://example.com' + path, options);
		return app.render(request);
	}

	it('excludes utm_* params from cache key by default', async () => {
		const first = await renderRequest('/cached?page=1&utm_source=google');
		assert.equal(first.headers.get('X-Astro-Cache'), 'MISS');

		// Same page, different UTM — should be a HIT
		const second = await renderRequest('/cached?page=1&utm_source=twitter&utm_medium=social');
		assert.equal(second.headers.get('X-Astro-Cache'), 'HIT');

		// Same page, no UTM — should also be a HIT
		const third = await renderRequest('/cached?page=1');
		assert.equal(third.headers.get('X-Astro-Cache'), 'HIT');
	});

	it('excludes fbclid from cache key by default', async () => {
		const first = await renderRequest('/cached?page=2');
		assert.equal(first.headers.get('X-Astro-Cache'), 'MISS');

		const second = await renderRequest('/cached?page=2&fbclid=abc123');
		assert.equal(second.headers.get('X-Astro-Cache'), 'HIT');
	});

	it('excludes gclid from cache key by default', async () => {
		const first = await renderRequest('/cached?page=3');
		assert.equal(first.headers.get('X-Astro-Cache'), 'MISS');

		const second = await renderRequest('/cached?page=3&gclid=xyz789');
		assert.equal(second.headers.get('X-Astro-Cache'), 'HIT');
	});

	it('still differentiates on non-excluded params', async () => {
		const first = await renderRequest('/cached?page=10');
		assert.equal(first.headers.get('X-Astro-Cache'), 'MISS');

		const second = await renderRequest('/cached?page=20');
		assert.equal(second.headers.get('X-Astro-Cache'), 'MISS');
	});
});

describe('Memory cache provider — query include', () => {
	let fixture: Fixture;
	let app: App;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/cache-memory-query-include/',
			output: 'server',
			adapter: testAdapter(),
			outDir: './dist/cache-memory-query-memory-cache-provider-query-include/',
		});
		await fixture.build({});
		app = await fixture.loadTestAdapterApp();
	});

	async function renderRequest(path: string, options?: RequestInit) {
		const request = new Request('http://example.com' + path, options);
		return app.render(request);
	}

	it('only includes allowlisted params in cache key', async () => {
		const first = await renderRequest('/cached?page=1&sort=name');
		assert.equal(first.headers.get('X-Astro-Cache'), 'MISS');

		// Same allowed params + extra unknown param — should be a HIT
		const second = await renderRequest('/cached?page=1&sort=name&tracking=abc');
		assert.equal(second.headers.get('X-Astro-Cache'), 'HIT');

		// Same allowed params, different order — also a HIT
		const third = await renderRequest('/cached?sort=name&page=1');
		assert.equal(third.headers.get('X-Astro-Cache'), 'HIT');
	});

	it('different allowed param values produce different entries', async () => {
		const first = await renderRequest('/cached?page=5&sort=name');
		assert.equal(first.headers.get('X-Astro-Cache'), 'MISS');

		const second = await renderRequest('/cached?page=5&sort=price');
		assert.equal(second.headers.get('X-Astro-Cache'), 'MISS');
	});

	it('request with no query params matches request with only non-allowed params', async () => {
		const first = await renderRequest('/cached');
		assert.equal(first.headers.get('X-Astro-Cache'), 'MISS');

		// Only non-allowed params — effectively same key as no params
		const second = await renderRequest('/cached?utm_source=google&tracking=abc');
		assert.equal(second.headers.get('X-Astro-Cache'), 'HIT');
	});
});
