import type { SSRManifest } from '../../core/app/types.js';
import type { RouteData } from '../../types/public/internal.js';
import type { GetStaticPathsItem } from '../../types/public/common.js';
import { stringifyParams } from '../../core/routing/params.js';
import {
	routeIsRedirect,
	routeIsFallback,
	getFallbackRoute,
} from '../../core/routing/helpers.js';
import { generatePaginateFunction } from '../../core/render/paginate.js';
import type { PaginateFunction } from '../../types/public/common.js';
import { validateDynamicRouteModule, validateGetStaticPathsResult } from '../../core/routing/validation.js';

/**
 * Get all static paths for prerendering.
 * This mirrors the logic in generate.ts (getPathsForRoute) and pipeline.ts (retrieveRoutesToGenerate).
 *
 * @param manifest - The SSR manifest containing routes and pageMap
 * @returns Array of pathnames to prerender
 */
export async function getStaticPaths(manifest: SSRManifest): Promise<string[]> {
	const allPaths: string[] = [];
	const builtPaths = new Set<string>();

	// Collect routes to generate (mirrors retrieveRoutesToGenerate)
	const routesToGenerate: RouteData[] = [];
	for (const { routeData } of manifest.routes) {
		// Skip non-prerendered routes
		if (!routeData.prerender) continue;

		// Include redirects
		if (routeIsRedirect(routeData)) {
			routesToGenerate.push(routeData);
			continue;
		}

		// Include fallbacks if i18n has fallback configured
		if (routeIsFallback(routeData) && manifest.i18n?.fallback) {
			routesToGenerate.push(routeData);
			continue;
		}

		// Regular page
		routesToGenerate.push(routeData);
	}

	// Get paths for each route (mirrors getPathsForRoute)
	for (const route of routesToGenerate) {
		// Also process fallback routes
		for (const currentRoute of eachRouteInRouteData(route)) {
			const paths = await getPathsForRoute(currentRoute, manifest, builtPaths);
			allPaths.push(...paths);
		}
	}

	return allPaths;
}

/**
 * Yields the route and its fallback routes
 */
function* eachRouteInRouteData(route: RouteData): Generator<RouteData> {
	yield route;
	for (const fallbackRoute of route.fallbackRoutes) {
		yield fallbackRoute;
	}
}

/**
 * Get paths for a single route.
 * Mirrors the logic in generate.ts getPathsForRoute().
 */
async function getPathsForRoute(
	route: RouteData,
	manifest: SSRManifest,
	builtPaths: Set<string>,
): Promise<string[]> {
	let paths: string[] = [];

	// Static route - single pathname
	if (route.pathname) {
		paths.push(route.pathname);
		builtPaths.add(removeTrailingForwardSlash(route.pathname));
		return paths;
	}

	// Dynamic route - need to call getStaticPaths
	if (!manifest.pageMap) {
		throw new Error(
			`pageMap not found in manifest. This is unexpected and likely a bug in Astro.`,
		);
	}

	const pageModuleLoader = manifest.pageMap.get(route.component);
	if (!pageModuleLoader) {
		throw new Error(
			`Unable to find module for ${route.component}. This is unexpected and likely a bug in Astro.`,
		);
	}

	// Load the module and get the component instance
	const singlePageModule = await pageModuleLoader();
	const componentInstance = await singlePageModule.page();

	// Determine which route to use for getStaticPaths
	const routeToProcess = routeIsRedirect(route)
		? route.redirectRoute
		: routeIsFallback(route)
			? getFallbackRoute(route, manifest.routes)
			: route;

	const actualRoute = routeToProcess ?? route;

	// Validate module has getStaticPaths
	validateDynamicRouteModule(componentInstance, { ssr: manifest.serverLike, route: actualRoute });

	if (!componentInstance.getStaticPaths) {
		return paths;
	}

	// Call getStaticPaths with paginate function
	// Cast needed for internal typing reasons (see route-cache.ts)
	const staticPaths = await componentInstance.getStaticPaths({
		paginate: generatePaginateFunction(actualRoute, manifest.base, manifest.trailingSlash) as PaginateFunction,
		routePattern: actualRoute.route,
	});

	validateGetStaticPathsResult(staticPaths, actualRoute);

	// Convert params to pathnames using stringifyParams
	paths = staticPaths
		.map((staticPath: GetStaticPathsItem) => {
			return stringifyParams(staticPath.params, route, manifest.trailingSlash);
		})
		.filter((pathname: string) => {
			const normalized = removeTrailingForwardSlash(pathname);
			// Skip if already built
			if (builtPaths.has(normalized)) {
				return false;
			}
			builtPaths.add(normalized);
			return true;
		});

	return paths;
}

function removeTrailingForwardSlash(path: string): string {
	return path.endsWith('/') ? path.slice(0, -1) : path;
}
