import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { StaticPaths } from '../../../dist/runtime/prerender/static-paths.js';
import type { StaticPathsApp } from '../../../dist/runtime/prerender/static-paths.js';

interface MockRouteData {
	route: string;
	pathname: string | undefined;
	prerender: boolean;
	type: string;
	pattern: RegExp;
	params: string[];
	component: string;
	generate: (data: { route: string }) => string;
	segments: Array<Array<{ content: string; dynamic: boolean; spread: boolean }>>;
	fallbackRoutes: unknown[];
	isIndex: boolean;
	mockGetStaticPaths?: () => Array<{ params: Record<string, string> }>;
}

/**
 * Creates a minimal mock app for testing StaticPaths.
 */
function createMockApp({
	routes,
	routeCache = new Map(),
	i18n = undefined,
}: {
	routes: Array<{ routeData: MockRouteData }>;
	routeCache?: Map<unknown, unknown>;
	i18n?: undefined;
}): StaticPathsApp {
	return {
		manifest: {
			routes,
			i18n,
			serverLike: false,
			base: '/',
			trailingSlash: 'ignore',
		},
		pipeline: {
			routeCache,
			async getComponentByRoute(route: MockRouteData) {
				// Return a mock component with getStaticPaths if route is dynamic
				if (!route.pathname) {
					return {
						getStaticPaths: route.mockGetStaticPaths || (() => []),
					};
				}
				return {};
			},
		},
	} as unknown as StaticPathsApp;
}

/**
 * Creates segments array from a route pattern.
 */
function createSegments(
	route: string,
): Array<Array<{ content: string; dynamic: boolean; spread: boolean }>> {
	const parts = route.split('/').filter(Boolean);
	return parts.map((part) => {
		if (part.startsWith('[') && part.endsWith(']')) {
			const paramName = part.slice(1, -1);
			return [{ content: paramName, dynamic: true, spread: false }];
		}
		return [{ content: part, dynamic: false, spread: false }];
	});
}

/**
 * Creates a mock route data object.
 */
function createMockRoute({
	pathname,
	prerender = true,
	mockGetStaticPaths,
	route = '/[slug]',
}: {
	pathname?: string;
	prerender?: boolean;
	mockGetStaticPaths?: () => Array<{ params: Record<string, string> }>;
	route?: string;
} = {}): { routeData: MockRouteData } {
	// Extract param names from route pattern
	const paramMatches = route.matchAll(/\[([^\]]+)\]/g);
	const params = pathname ? [] : Array.from(paramMatches, (m) => m[1]);

	return {
		routeData: {
			route,
			pathname,
			prerender,
			type: 'page',
			pattern: new RegExp('^' + route.replace(/\[[^\]]+\]/g, '([^/]+)') + '$'),
			params,
			component: 'src/pages' + route + '.astro',
			generate: (data: { route: string }) => data.route,
			segments: pathname ? [] : createSegments(route),
			fallbackRoutes: [],
			isIndex: false,
			mockGetStaticPaths,
		},
	};
}

describe('StaticPaths', () => {
	describe('getAll()', () => {
		it('should return static paths for static routes', async () => {
			const routes = [
				createMockRoute({ pathname: '/about' }),
				createMockRoute({ pathname: '/contact' }),
			];

			const app = createMockApp({ routes });
			const staticPaths = new StaticPaths(app);
			const paths = await staticPaths.getAll();

			assert.equal(paths.length, 2);
			assert.equal(paths[0].pathname, '/about');
			assert.equal(paths[1].pathname, '/contact');
		});

		it('should return static paths for dynamic routes', async () => {
			const mockGetStaticPaths = () => [
				{ params: { slug: 'post-1' } },
				{ params: { slug: 'post-2' } },
			];

			const routes = [
				createMockRoute({
					pathname: undefined,
					route: '/blog/[slug]',
					mockGetStaticPaths,
				}),
			];

			const app = createMockApp({ routes });
			const staticPaths = new StaticPaths(app);
			const paths = await staticPaths.getAll();

			assert.equal(paths.length, 2);
			assert.equal(paths[0].pathname, '/blog/post-1');
			assert.equal(paths[1].pathname, '/blog/post-2');
		});

		it('should skip non-prerendered routes', async () => {
			const routes = [
				createMockRoute({ pathname: '/ssr-page', prerender: false }),
				createMockRoute({ pathname: '/static-page', prerender: true }),
			];

			const app = createMockApp({ routes });
			const staticPaths = new StaticPaths(app);
			const paths = await staticPaths.getAll();

			assert.equal(paths.length, 1);
			assert.equal(paths[0].pathname, '/static-page');
		});

		it('should handle a large number of static routes without stack overflow', async () => {
			// This test specifically addresses issue #15578
			// The old implementation used spread operator which caused stack overflow
			// with large arrays: allPaths.push(...paths)
			// The fix uses a loop instead: for (const path of paths) allPaths.push(path)

			// Use 200,000 routes to reliably trigger stack overflow with spread operator.
			// The spread operator fails because it tries to pass all array elements as
			// individual arguments to push(), hitting the maximum call stack size limit.
			const largeRouteCount = 200000;
			const routes = [];

			// Create a large number of static routes
			for (let i = 0; i < largeRouteCount; i++) {
				routes.push(createMockRoute({ pathname: `/page-${i}` }));
			}

			const app = createMockApp({ routes });
			const staticPaths = new StaticPaths(app);

			// This should not throw "Maximum call stack size exceeded"
			const paths = await staticPaths.getAll();

			assert.equal(paths.length, largeRouteCount);
			assert.equal(paths[0].pathname, '/page-0');
			assert.equal(paths[largeRouteCount - 1].pathname, `/page-${largeRouteCount - 1}`);
		});

		it('should handle a dynamic route with a large number of paths without stack overflow', async () => {
			// This tests the same issue but for dynamic routes with many paths
			// Use 200,000 paths to reliably trigger stack overflow with spread operator
			const largePathCount = 200000;

			const mockGetStaticPaths = () => {
				const paths = [];
				for (let i = 0; i < largePathCount; i++) {
					paths.push({ params: { id: `item-${i}` } });
				}
				return paths;
			};

			const routes = [
				createMockRoute({
					pathname: undefined,
					route: '/items/[id]',
					mockGetStaticPaths,
				}),
			];

			const app = createMockApp({ routes });
			const staticPaths = new StaticPaths(app);

			// This should not throw "Maximum call stack size exceeded"
			const paths = await staticPaths.getAll();

			assert.equal(paths.length, largePathCount);
			assert.equal(paths[0].pathname, '/items/item-0');
			assert.equal(paths[largePathCount - 1].pathname, `/items/item-${largePathCount - 1}`);
		});

		it('should handle mixed static and dynamic routes with large counts', async () => {
			const staticCount = 50000;
			const dynamicCount = 50000;
			const routes = [];

			// Add static routes
			for (let i = 0; i < staticCount; i++) {
				routes.push(createMockRoute({ pathname: `/static-${i}` }));
			}

			// Add a dynamic route with many paths
			const mockGetStaticPaths = () => {
				const paths = [];
				for (let i = 0; i < dynamicCount; i++) {
					paths.push({ params: { slug: `dynamic-${i}` } });
				}
				return paths;
			};

			routes.push(
				createMockRoute({
					pathname: undefined,
					route: '/blog/[slug]',
					mockGetStaticPaths,
				}),
			);

			const app = createMockApp({ routes });
			const staticPaths = new StaticPaths(app);

			// This should not throw "Maximum call stack size exceeded"
			const paths = await staticPaths.getAll();

			assert.equal(paths.length, staticCount + dynamicCount);
		});
	});
});
