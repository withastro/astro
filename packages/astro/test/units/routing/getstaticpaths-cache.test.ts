import assert from 'node:assert/strict';
import { describe, it, before, beforeEach } from 'node:test';
import type { ComponentInstance } from '../../../dist/types/astro.js';
import type { AstroLogMessage, AstroLoggerDestination } from '../../../dist/core/logger/core.js';
import { AstroLogger } from '../../../dist/core/logger/core.js';
import { RouteCache, callGetStaticPaths } from '../../../dist/core/render/route-cache.js';
import { dynamicPart, makeRoute } from './test-helpers.ts';

function mod(overrides: Partial<ComponentInstance>): ComponentInstance {
	return overrides as ComponentInstance;
}

describe('getStaticPaths caching behavior', () => {
	let routeCache: RouteCache;
	let logger: AstroLogger;
	let callCount: number;

	const destination: AstroLoggerDestination<AstroLogMessage> = {
		write: () => true,
	};

	before(() => {
		logger = new AstroLogger({ destination, level: 'error' });
	});

	beforeEach(() => {
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
});
