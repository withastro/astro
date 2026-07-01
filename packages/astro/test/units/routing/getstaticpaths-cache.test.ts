import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import type { ComponentInstance } from '../../../dist/types/astro.js';
import { RouteCache, callGetStaticPaths } from '../../../dist/core/render/route-cache.js';
import { SpyLogger } from '../test-utils.ts';
import { dynamicPart, makeRoute } from './test-helpers.ts';

function mod(overrides: Partial<ComponentInstance>): ComponentInstance {
	return overrides as ComponentInstance;
}

describe('getStaticPaths caching behavior', () => {
	let routeCache: RouteCache;
	let logger: SpyLogger;
	let callCount: number;

	beforeEach(() => {
		logger = new SpyLogger();
		routeCache = new RouteCache(logger, 'production');
		callCount = 0;
	});

	it('only calls getStaticPaths once and caches the result', async () => {
		const route = makeRoute({
			segments: [[dynamicPart('param')]],
			trailingSlash: 'never',
			route: '/[param]',
			pathname: undefined,
			type: 'page',
			prerender: true,
		});

		const testMod = mod({
			getStaticPaths: async () => {
				callCount++;
				return [{ params: { param: 'a' } }, { params: { param: 'b' } }, { params: { param: 'c' } }];
			},
		});

		// First call should execute getStaticPaths
		const result1 = await callGetStaticPaths({
			mod: testMod,
			route,
			routeCache,
			ssr: false,
			base: '/',
			trailingSlash: 'never',
		});

		assert.equal(callCount, 1, 'getStaticPaths should be called once');
		assert.equal(result1.length, 3, 'should return all paths');

		// Second call should use cache
		const result2 = await callGetStaticPaths({
			mod: testMod,
			route,
			routeCache,
			ssr: false,
			base: '/',
			trailingSlash: 'never',
		});

		assert.equal(callCount, 1, 'getStaticPaths should not be called again');
		assert.equal(result2.length, 3, 'should return cached paths');
		assert.deepEqual(result1, result2, 'cached result should match original');

		// Third call should also use cache
		const result3 = await callGetStaticPaths({
			mod: testMod,
			route,
			routeCache,
			ssr: false,
			base: '/',
			trailingSlash: 'never',
		});

		assert.equal(callCount, 1, 'getStaticPaths should still not be called');
		assert.equal(result3.length, 3, 'should return cached paths');
	});

	it('clears cache when clearAll is called', async () => {
		const route = makeRoute({
			segments: [[dynamicPart('test')]],
			trailingSlash: 'never',
			route: '/[test]',
			pathname: undefined,
			type: 'page',
			prerender: true,
		});

		const testMod = mod({
			getStaticPaths: async () => {
				callCount++;
				return [{ params: { test: 'value' } }];
			},
		});

		// First call
		await callGetStaticPaths({
			mod: testMod,
			route,
			routeCache,
			ssr: false,
			base: '/',
			trailingSlash: 'never',
		});

		assert.equal(callCount, 1, 'getStaticPaths called once');

		// Clear cache
		routeCache.clearAll();

		// Second call after clearing should call getStaticPaths again
		await callGetStaticPaths({
			mod: testMod,
			route,
			routeCache,
			ssr: false,
			base: '/',
			trailingSlash: 'never',
		});

		assert.equal(callCount, 2, 'getStaticPaths called again after cache clear');
	});

	it('re-calls getStaticPaths when module identity changes (HMR)', async () => {
		const route = makeRoute({
			segments: [[dynamicPart('slug')]],
			trailingSlash: 'never',
			route: '/[slug]',
			pathname: undefined,
			type: 'page',
			prerender: true,
		});

		const oldMod = mod({
			getStaticPaths: async () => {
				callCount++;
				return [{ params: { slug: 'one' }, props: { title: 'old' } }];
			},
		});

		// First call with original module
		const result1 = await callGetStaticPaths({
			mod: oldMod,
			route,
			routeCache,
			ssr: false,
			base: '/',
			trailingSlash: 'never',
		});

		assert.equal(callCount, 1);
		assert.equal(result1.length, 1);

		// Same module should hit cache
		const _result2 = await callGetStaticPaths({
			mod: oldMod,
			route,
			routeCache,
			ssr: false,
			base: '/',
			trailingSlash: 'never',
		});

		assert.equal(callCount, 1, 'same module should use cache');

		// Simulate HMR: a new module object with updated getStaticPaths
		const newMod = mod({
			getStaticPaths: async () => {
				callCount++;
				return [{ params: { slug: 'one' }, props: { title: 'new' } }];
			},
		});

		const result3 = await callGetStaticPaths({
			mod: newMod,
			route,
			routeCache,
			ssr: false,
			base: '/',
			trailingSlash: 'never',
		});

		assert.equal(callCount, 2, 'new module should bypass cache');
		assert.equal(result3.keyed.get('/one')?.props?.title, 'new');
	});

	it('does not log "route cache overwritten" on repeated SSR requests for the same module', async () => {
		const spyLogger = new SpyLogger();
		const ssrCache = new RouteCache(spyLogger, 'production');

		const route = makeRoute({
			segments: [[dynamicPart('slug')]],
			trailingSlash: 'never',
			route: '/[slug]',
			pathname: undefined,
			type: 'page',
			prerender: false,
		});

		const testMod = mod({});
		const opts = {
			mod: testMod,
			route,
			routeCache: ssrCache,
			ssr: true,
			base: '/' as const,
			trailingSlash: 'never' as const,
		};

		await callGetStaticPaths(opts);
		await callGetStaticPaths(opts);
		await callGetStaticPaths(opts);

		const overwriteWarnings = spyLogger.logs.filter((l) =>
			l.message.includes('route cache overwritten'),
		);
		assert.equal(
			overwriteWarnings.length,
			0,
			'SSR should not log "route cache overwritten" on repeated calls',
		);
	});
});
