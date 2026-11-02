import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { describe, it } from 'node:test';
import { handleCache, provideCache } from '../../../dist/core/cache/handler.js';
import memoryProvider from '../../../dist/core/cache/memory-provider.js';
import type { CacheLike } from '../../../dist/core/cache/runtime/cache.js';
import type { CacheProvider } from '../../../dist/core/cache/types.js';
import { FetchState } from '../../../dist/core/fetch/fetch-state.js';
import { createBasicPipeline } from '../test-utils.ts';

async function setup(provider: CacheProvider, method = 'GET') {
	const { manifest } = createBasicPipeline({
		mode: 'production',
		manifest: {
			cacheConfig: { provider: 'test' },
			cacheProvider: async () => ({ default: () => provider }),
		},
	});
	const state = new FetchState(manifest, new Request('http://localhost/', { method }));
	await provideCache(state);
	return { state, cache: state.resolve<CacheLike>('cache')! };
}

function provider(overrides: Partial<CacheProvider> = {}): CacheProvider {
	return {
		name: 'custom',
		async onRequest(_context, next) {
			return next();
		},
		async invalidate() {},
		...overrides,
	};
}

describe('runtime provider buffering capability', () => {
	for (const bufferResponse of [undefined, false, true]) {
		it(`only waits for a cacheable body when shouldBufferResponse returns ${bufferResponse}`, async () => {
			const { state, cache } = await setup(
				provider({
					shouldBufferResponse: bufferResponse === undefined ? undefined : () => bufferResponse,
					setHeaders: (options) => new Headers({ 'X-Max-Age': String(options.maxAge) }),
				}),
			);
			cache.set({ maxAge: 300, tags: ['early'] });
			const gate = Promise.withResolvers<void>();
			const response = new Response(
				new ReadableStream({
					async start(controller) {
						controller.enqueue(new TextEncoder().encode('first chunk'));
						// This stream can stay open indefinitely, e.g. SSE or a custom
						// provider writing the body to storage in waitUntil().
						await gate.promise;
						cache.set({ maxAge: 60, tags: ['late'] });
						controller.close();
					},
				}),
				{ status: 201, headers: { 'Content-Type': 'text/plain', 'X-Test': 'preserved' } },
			);
			let resolved = false;
			const pending = handleCache(state, async () => response).then((res) => {
				resolved = true;
				return res;
			});
			await setImmediate();
			try {
				assert.equal(resolved, bufferResponse !== true);
			} finally {
				gate.resolve();
			}
			const result = await pending;
			assert.equal(await result.text(), 'first chunk');
			assert.equal(result.status, 201);
			assert.equal(result.headers.get('Content-Type'), 'text/plain');
			assert.equal(result.headers.get('X-Test'), 'preserved');
			assert.equal(result.headers.get('X-Max-Age'), bufferResponse === true ? '60' : '300');
			// Cache state can still be used by a custom provider after buffering,
			// independently of the early HTTP header snapshot.
			assert.equal(cache.options.maxAge, 60);
			assert.deepEqual(cache.tags, ['early', 'late']);
			assert.equal(result.headers.get('X-Astro-Cache'), null);
		});
	}

	for (const method of ['GET', 'HEAD', 'POST']) {
		it(`does not buffer ${method === 'GET' ? 'uncacheable GET' : method} streams even with opt-in`, async () => {
			const { state, cache } = await setup(provider({ shouldBufferResponse: () => true }), method);
			if (method !== 'GET') cache.set({ maxAge: 300 });
			const gate = Promise.withResolvers<void>();
			const stream = new ReadableStream({
				async start(controller) {
					await gate.promise;
					controller.close();
				},
			});
			let resolved = false;
			const pending = handleCache(state, async () => new Response(stream)).then((response) => {
				resolved = true;
				return response;
			});
			await setImmediate();
			try {
				assert.equal(resolved, true);
			} finally {
				gate.resolve();
			}
			await (await pending).text();
		});
	}

	const uncacheableHeaders: Record<string, string>[] = [
		{ 'Set-Cookie': 'session=private' },
		{ Vary: 'Cookie' },
		{ Vary: '*' },
	];
	for (const headers of uncacheableHeaders) {
		it(`memory cache does not wait for streams already uncacheable due to ${JSON.stringify(headers)}`, async () => {
			const { state, cache } = await setup(memoryProvider(undefined));
			cache.set({ maxAge: 300 });
			const gate = Promise.withResolvers<void>();
			const stream = new ReadableStream({
				async start(controller) {
					await gate.promise;
					controller.close();
				},
			});
			let resolved = false;
			const pending = handleCache(state, async () => new Response(stream, { headers })).then(
				(response) => {
					resolved = true;
					return response;
				},
			);
			await setImmediate();
			try {
				assert.equal(resolved, true);
			} finally {
				gate.resolve();
			}
			const response = await pending;
			assert.equal(response.headers.get('X-Astro-Cache'), null);
			await response.text();
		});
	}

	it('keeps bodyless responses bodyless, including null-body status codes', async () => {
		for (const status of [200, 204, 304]) {
			const { state, cache } = await setup(provider({ shouldBufferResponse: () => true }));
			cache.set({ maxAge: 300 });
			const response = await handleCache(state, async () => new Response(null, { status }));
			assert.equal(response.status, status);
			assert.equal(response.body, null);
		}
	});

	it('uses final directives with custom setHeaders for opt-in providers', async () => {
		const snapshots: unknown[] = [];
		const { state, cache } = await setup(
			provider({
				shouldBufferResponse: () => true,
				setHeaders(options) {
					snapshots.push(options);
					return new Headers({ 'X-Provider-Directives': JSON.stringify(options) });
				},
			}),
		);
		cache.set({ maxAge: 300 });
		const stream = new ReadableStream({
			async start(controller) {
				await setImmediate();
				cache.set({ maxAge: 60, swr: 5, tags: ['late'] });
				controller.close();
			},
		});
		const response = await handleCache(state, async () => new Response(stream));
		assert.deepEqual(snapshots, [{ maxAge: 60, swr: 5, tags: ['late'] }]);
		assert.deepEqual(JSON.parse(response.headers.get('X-Provider-Directives')!), snapshots[0]);
	});

	it('does not store a partially rendered response if body buffering fails', async () => {
		let stores = 0;
		const { state, cache } = await setup(
			provider({
				shouldBufferResponse: () => true,
				async onRequest(_context, next) {
					const response = await next();
					stores++;
					return response;
				},
			}),
		);
		cache.set({ maxAge: 300 });
		const stream = new ReadableStream({
			async start(controller) {
				await setImmediate();
				controller.error(new Error('render failed'));
			},
		});
		await assert.rejects(
			handleCache(state, async () => new Response(stream)),
			/render failed/,
		);
		assert.equal(stores, 0);
	});
});
