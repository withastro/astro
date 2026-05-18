import type { SSRManifest } from '../../core/app/types.js';
import type { Pipeline } from '../../core/base-pipeline.js';
import type { PathWithRoute } from '../../types/public/integrations.js';
import type { RouteData } from '../../types/public/internal.js';
import { stringifyParams } from '../../core/routing/params.js';
import { getFallbackRoute, routeIsFallback, routeIsRedirect } from '../../core/routing/helpers.js';
import { callGetStaticPaths } from '../../core/render/route-cache.js';

export type { PathWithRoute } from '../../types/public/integrations.js';

/**
 * Minimal interface for what StaticPaths needs from an App.
 * This allows adapters to pass any App-like object (BuildApp, NodeApp, etc).
 */
export interface StaticPathsApp {
	manifest: SSRManifest;
	pipeline: Pick<Pipeline, 'routeCache' | 'getComponentByRoute'>;
}

/**
 * Collects all static paths for prerendering.
 * Handles calling getStaticPaths on each route and populating the route cache.
 */
export class StaticPaths {
	#app: StaticPathsApp;

	constructor(app: StaticPathsApp) {
		this.#app = app;
	}

	/**
	 * Get all static paths for prerendering with their associated routes.
	 * This avoids needing to re-match routes later, which can be incorrect due to route priority.
	 */
	async getAll(): Promise<PathWithRoute[]> {
		const allPaths: PathWithRoute[] = [];
		const manifest = this.#app.manifest;

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
				const paths = await this.#getPathsForRoute(currentRoute);
				// Use a loop instead of spread operator (allPaths.push(...paths)) to avoid
				// "Maximum call stack size exceeded" error with large arrays (issue #15578).
				// The spread operator tries to pass all array elements as individual arguments,
				// which hits the call stack limit when dealing with 100k+ routes.
				for (const path of paths) {
					allPaths.push(path);
				}
			}
		}

		return allPaths;
	}

	/**
	 * Get paths for a single route.
	 * Note: Does not filter duplicates - that's handled by generate.ts with conflict detection.
	 */
	async #getPathsForRoute(route: RouteData): Promise<PathWithRoute[]> {
		const paths: PathWithRoute[] = [];
		const manifest = this.#app.manifest;
		const routeCache = this.#app.pipeline.routeCache;

		// Static route - single pathname
		if (route.pathname) {
			paths.push({ pathname: route.pathname, route });
			return paths;
		}

		// Dynamic route - need to call getStaticPaths
		// Use pipeline.getComponentByRoute which handles redirects and fallbacks
		const componentInstance = await this.#app.pipeline.getComponentByRoute(route);

		// Determine which route to use for getStaticPaths
		const routeToProcess = routeIsRedirect(route)
			? route.redirectRoute
			: routeIsFallback(route)
				? getFallbackRoute(route, manifest.routes)
				: route;

		const actualRoute = routeToProcess ?? route;

		// Use callGetStaticPaths to populate the route cache
		const staticPaths = await callGetStaticPaths({
			mod: componentInstance,
			route: actualRoute,
			routeCache,
			ssr: manifest.serverLike,
			base: manifest.base,
			trailingSlash: manifest.trailingSlash,
		});

		// Convert params to pathnames using stringifyParams
		for (const staticPath of staticPaths) {
			const pathname = stringifyParams(staticPath.params, route, manifest.trailingSlash);
			paths.push({ pathname, route });
		}

		return paths;
	}
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
