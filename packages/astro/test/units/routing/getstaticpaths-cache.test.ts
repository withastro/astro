import assert from 'node:assert/strict';
import { describe, it, before, beforeEach } from 'node:test';
import type { ComponentInstance } from '../../../dist/types/astro.js';
import type { AstroLoggerMessage, AstroLoggerDestination } from '../../../dist/core/logger/core.js';
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

	const destination: AstroLoggerDestination<AstroLoggerMessage> = {
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

	it('returns fresh data after clearAll simulating per-request clearing in dev', async () => {
		const route = makeRoute({
			segments: [[dynamicPart('id')]],
			trailingSlash: 'never',
			route: '/article/[id]',
			pathname: undefined,
			type: 'page',
			prerender: true,
		});

		// Simulate an external API that returns different data on each call
		// (e.g. CMS content that changes between browser refreshes)
		let fetchCounter = 0;
		const testMod = mod({
			getStaticPaths: async () => {
				fetchCounter++;
				return [
					{ params: { id: '1' }, props: { title: `Article fetched #${fetchCounter}` } },
				];
			},
		});

		// First "request" — getStaticPaths runs and fetches data
		const result1 = await callGetStaticPaths({
			mod: testMod, route, routeCache, ssr: false, base: '/', trailingSlash: 'never',
		});
		assert.equal(fetchCounter, 1);
		assert.equal(result1[0].props?.title, 'Article fetched #1');

		// Simulate dev server clearing cache before next request
		routeCache.clearAll();

		// Second "request" — getStaticPaths runs again with fresh data
		const result2 = await callGetStaticPaths({
			mod: testMod, route, routeCache, ssr: false, base: '/', trailingSlash: 'never',
		});
		assert.equal(fetchCounter, 2, 'getStaticPaths should re-run after cache clear');
		assert.equal(result2[0].props?.title, 'Article fetched #2', 'should have fresh props from second fetch');

		// Simulate dev server clearing cache before third request
		routeCache.clearAll();

		// Third "request" — getStaticPaths runs again
		const result3 = await callGetStaticPaths({
			mod: testMod, route, routeCache, ssr: false, base: '/', trailingSlash: 'never',
		});
		assert.equal(fetchCounter, 3, 'getStaticPaths should re-run on each request after cache clear');
		assert.equal(result3[0].props?.title, 'Article fetched #3', 'should have fresh props from third fetch');
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
