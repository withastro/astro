import assert from 'node:assert/strict';
import { describe, it, before, beforeEach } from 'node:test';
import { Logger } from '../../../dist/core/logger/core.js';
import { RouteCache, callGetStaticPaths } from '../../../dist/core/render/route-cache.js';
import { dynamicPart, makeRoute } from './test-helpers.js';

describe('getStaticPaths caching behavior', () => {
	let routeCache: RouteCache;
	let logger: Logger;
	let callCount: number;

	before(() => {
		logger = new Logger({ dest: 'memory' as any, level: 'error' });
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

		const mod: any = {
			default: () => {},
			getStaticPaths: async () => {
				callCount++;
				return [{ params: { param: 'a' } }, { params: { param: 'b' } }, { params: { param: 'c' } }];
			},
		};

		const result1 = await callGetStaticPaths({
			mod,
			route,
			routeCache,
			ssr: false,
			base: '/',
			trailingSlash: 'never',
		});
		assert.equal(callCount, 1);
		assert.equal(result1.length, 3);

		const result2 = await callGetStaticPaths({
			mod,
			route,
			routeCache,
			ssr: false,
			base: '/',
			trailingSlash: 'never',
		});
		assert.equal(callCount, 1);
		assert.equal(result2.length, 3);
		assert.deepEqual(result1, result2);

		const result3 = await callGetStaticPaths({
			mod,
			route,
			routeCache,
			ssr: false,
			base: '/',
			trailingSlash: 'never',
		});
		assert.equal(callCount, 1);
		assert.equal(result3.length, 3);
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

		const mod: any = {
			default: () => {},
			getStaticPaths: async () => {
				callCount++;
				return [{ params: { test: 'value' } }];
			},
		};

		await callGetStaticPaths({
			mod,
			route,
			routeCache,
			ssr: false,
			base: '/',
			trailingSlash: 'never',
		});
		assert.equal(callCount, 1);

		routeCache.clearAll();

		await callGetStaticPaths({
			mod,
			route,
			routeCache,
			ssr: false,
			base: '/',
			trailingSlash: 'never',
		});
		assert.equal(callCount, 2);
	});
});
