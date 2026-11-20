import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { after, before, beforeEach, describe, it } from 'node:test';
import type { CacheProviderFactory } from 'astro';
import { type CloudflareCacheOptions, cacheCloudflare } from '../../dist/cache/index.js';

type CacheCall = { method: 'purge' | 'invalidate'; tags?: string[] };
type CacheResult = { success: boolean; errors: { code: number; message: string }[] };

const STATE_KEY = '__astroCloudflareCacheStub';
const state: { calls: CacheCall[]; result: CacheResult } = {
	calls: [],
	result: { success: true, errors: [] },
};

const workersStub = `
const state = globalThis[${JSON.stringify(STATE_KEY)}];
export const env = {};
export const cache = {
	async purge(options) { state.calls.push({ method: 'purge', ...options }); return state.result; },
	async invalidate(options) { state.calls.push({ method: 'invalidate', ...options }); return state.result; },
};
`;

describe('Cloudflare cache provider invalidate()', () => {
	let hooks: ReturnType<typeof registerHooks> | undefined;
	let factory: CacheProviderFactory<CloudflareCacheOptions>;

	before(async () => {
		(globalThis as Record<string, unknown>)[STATE_KEY] = state;
		hooks = registerHooks({
			resolve(specifier, context, nextResolve) {
				if (specifier === 'cloudflare:workers') {
					return {
						url: `data:text/javascript,${encodeURIComponent(workersStub)}`,
						shortCircuit: true,
					};
				}
				return nextResolve(specifier, context);
			},
		});

		// The query gives this suite its own module instance bound to the stub.
		const providerUrl = new URL('../../dist/cache/provider.js?workers-stub', import.meta.url);
		({ default: factory } = await import(providerUrl.href));
	});

	beforeEach(() => {
		state.calls = [];
		state.result = { success: true, errors: [] };
	});

	after(() => {
		hooks?.deregister();
		delete (globalThis as Record<string, unknown>)[STATE_KEY];
	});

	it('purges the matching tags by default', async () => {
		await factory(cacheCloudflare().config).invalidate({ tags: ['posts'], path: '/blog' });

		assert.deepEqual(state.calls, [{ method: 'purge', tags: ['posts', 'astro-path:/blog'] }]);
	});

	it("calls Workers Cache invalidate() with the matching tags for invalidation: 'revalidate'", async () => {
		const provider = factory(cacheCloudflare({ invalidation: 'revalidate' }).config);
		await provider.invalidate({ tags: ['posts'], path: '/blog' });

		assert.deepEqual(state.calls, [{ method: 'invalidate', tags: ['posts', 'astro-path:/blog'] }]);
	});

	it("rejects with Cloudflare's errors when it refuses the invalidation", async () => {
		const errors = [{ code: 1000, message: 'Invalidation refused' }];
		state.result = { success: false, errors };
		const provider = factory(cacheCloudflare({ invalidation: 'revalidate' }).config);

		await assert.rejects(provider.invalidate({ tags: ['posts'] }), (error: Error) => {
			assert.match(error.message, /1000 Invalidation refused/);
			assert.deepEqual(error.cause, errors);
			return true;
		});
	});

	it('rejects an unknown invalidation option', () => {
		assert.throws(
			() => cacheCloudflare({ invalidation: 'stale' as 'revalidate' }),
			/Use 'purge' or 'revalidate'/,
		);
	});

	it('does not call the cache when there is nothing to invalidate', async () => {
		await factory(cacheCloudflare({ invalidation: 'revalidate' }).config).invalidate({});

		assert.deepEqual(state.calls, []);
	});
});
