import { removeTrailingForwardSlash } from '@astrojs/internal-helpers/path';
import { isLocalizedErrorRoute } from '../../i18n/error-routes.js';
import type { RouteData } from '../../types/public/internal.js';
import type { IntegrationResolvedRoute } from '../../types/public/integrations.js';
import type { RouteInfo, SSRManifest } from '../app/types.js';
import type { RoutesList } from '../../types/astro.js';
import { isRoute404, isRoute500 } from './internal/route-errors.js';

type RedirectRouteData = RouteData & {
	redirect: string;
};

/**
 * Function guard that checks if a route is redirect. If so, `RouteData.redirectRoute` and
 * `RouteData.redirect` aren't `undefined` anymore
 * @param route
 */
export function routeIsRedirect(route: RouteData | undefined): route is RedirectRouteData {
	return route?.type === 'redirect';
}

/**
 * True if the route represents a fallback entry.
 */
export function routeIsFallback(route: RouteData | undefined): boolean {
	return route?.type === 'fallback';
}

/**
 * Give a route, it returns its fallback routes from a `list` of `RouteInfo[]`.
 *
 * It throws an error if no fallback routes were found. This means there's an error
 * when we construct the list of routes
 * @param route
 * @param routeList
 */
export function getFallbackRoute(route: RouteData, routeList: RouteInfo[]): RouteData {
	const fallbackRoute = routeList.find((r) => {
		// The index doesn't have a fallback route
		if (route.route === '/' && r.routeData.route === '/') {
			return true;
		}
		return r.routeData.fallbackRoutes.find((f) => {
			return f.route === route.route;
		});
	});

	if (!fallbackRoute) {
		throw new Error(`No fallback route found for route ${route.route}`);
	}

	return fallbackRoute.routeData;
}

/**
 * Return a user-provided 404 route if one exists.
 */
export function getCustom404Route(manifestData: RoutesList): RouteData | undefined {
	return manifestData.routes.find((r) => isRoute404(r.route));
}

/**
 * Return a user-provided 500 route if one exists.
 */
export function getCustom500Route(manifestData: RoutesList): RouteData | undefined {
	return manifestData.routes.find((r) => isRoute500(r.route));
}

/**
 * Computes the default HTTP status code a route renders with:
 * `302` for i18n fallback matches, `404`/`500` for (possibly localized)
 * error routes, `200` otherwise.
 */
export function getDefaultStatusCode(
	manifest: SSRManifest,
	routeData: RouteData,
	pathname: string,
): number {
	if (!routeData.pattern.test(pathname)) {
		for (const fallbackRoute of routeData.fallbackRoutes) {
			if (fallbackRoute.pattern.test(pathname)) {
				return 302;
			}
		}
	}
	const route = removeTrailingForwardSlash(routeData.route);
	const locales = manifest.i18n?.locales;
	if (isRoute404(route) || isLocalizedErrorRoute(route, 404, locales)) {
		return 404;
	}
	if (isRoute500(route) || isLocalizedErrorRoute(route, 500, locales)) {
		return 500;
	}
	return 200;
}

/**
 * Returns true if the route definition contains `.html` as a static segment part,
 * as is the case for routes like `[slug].html.astro`. Used to avoid stripping the
 * `.html` suffix from pathnames that intentionally include it.
 */
export function routeHasHtmlExtension(route: RouteData): boolean {
	return route.segments.some((segment) =>
		segment.some((part) => !part.dynamic && part.content.includes('.html')),
	);
}

export function hasNonPrerenderedRoute(
	routes: Array<Pick<RouteData, 'type' | 'origin' | 'prerender'>>,
	options?: { includeEndpoints?: boolean; includeExternal?: boolean },
): boolean;
export function hasNonPrerenderedRoute(
	routes: Array<Pick<IntegrationResolvedRoute, 'type' | 'origin' | 'isPrerendered'>>,
	options?: { includeEndpoints?: boolean; includeExternal?: boolean },
): boolean;
export function hasNonPrerenderedRoute(
	routes: Array<
		| Pick<RouteData, 'type' | 'origin' | 'prerender'>
		| Pick<IntegrationResolvedRoute, 'type' | 'origin' | 'isPrerendered'>
	>,
	options?: { includeEndpoints?: boolean; includeExternal?: boolean },
): boolean {
	const includeEndpoints = options?.includeEndpoints ?? true;
	const includeExternal = options?.includeExternal ?? false;
	const routeTypes: ReadonlyArray<string> = includeEndpoints ? ['page', 'endpoint'] : ['page'];
	const origins: ReadonlyArray<string> = includeExternal ? ['project', 'external'] : ['project'];

	return routes.some((route) => {
		const isPrerendered = 'isPrerendered' in route ? route.isPrerendered : route.prerender;
		return routeTypes.includes(route.type) && origins.includes(route.origin) && !isPrerendered;
	});
}
