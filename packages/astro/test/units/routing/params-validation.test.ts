import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import { Logger } from '../../../dist/core/logger/core.js';
import { RouteCache, callGetStaticPaths } from '../../../dist/core/render/route-cache.js';
import { makeRoute } from './test-helpers.js';

describe('getStaticPaths param validation', () => {
	let routeCache: RouteCache;
	let logger: Logger;

	before(() => {
		logger = new Logger({ dest: 'memory' as any, level: 'error' });
		routeCache = new RouteCache(logger, 'production');
	});

	const route = makeRoute({
		segments: [[{ dynamic: true, content: 'testParam', spread: true }]],
		trailingSlash: 'never',
		route: '/[...testParam]',
		pathname: undefined,
		type: 'page',
		prerender: true,
	});

	const paramTestCases: Array<{ type: string; value: unknown; shouldPass: boolean }> = [
		{ type: 'string', value: 'foo', shouldPass: true },
		{ type: 'undefined', value: undefined, shouldPass: true },
		{ type: 'number', value: 123, shouldPass: false },
		{ type: 'boolean', value: false, shouldPass: false },
		{ type: 'array', value: [1, 2, 3], shouldPass: false },
		{ type: 'null', value: null, shouldPass: false },
		{ type: 'object', value: { a: 1 }, shouldPass: false },
		{ type: 'bigint', value: BigInt(123), shouldPass: false },
		{ type: 'function', value: setTimeout, shouldPass: false },
	];

	for (const { type, value, shouldPass } of paramTestCases) {
		it(`${shouldPass ? 'accepts' : 'rejects'} param type ${type}`, async () => {
			routeCache.clearAll();

			const mod = {
				default: () => {},
				getStaticPaths: async () => [{ params: { testParam: value } }],
			};

			try {
				await callGetStaticPaths({
					mod,
					route,
					routeCache,
					ssr: false,
					base: '/',
					trailingSlash: 'never',
				});

				if (!shouldPass) {
					assert.fail(`Expected validation error for param type ${type}`);
				}
			} catch (err: any) {
				if (shouldPass) throw err;
				assert.equal(err.name, 'GetStaticPathsInvalidRouteParam');
				const expectedType = type === 'array' ? 'object' : type;
				assert.match(err.message, new RegExp(expectedType));
			}
		});
	}
});
