import type { RouteData } from '../../types/public/internal.js';
import type { IntegrationResolvedRoute } from '../../types/public/integrations.js';
import type { RouteInfo } from '../app/types.js';
import type { RoutesList } from '../../types/astro.js';
type RedirectRouteData = RouteData & {
	redirect: string;
};
/**
 * Function guard that checks if a route is redirect. If so, `RouteData.redirectRoute` and
 * `RouteData.redirect` aren't `undefined` anymore
 * @param route
 */
export declare function routeIsRedirect(route: RouteData | undefined): route is RedirectRouteData;
/**
 * True if the route represents a fallback entry.
 */
export declare function routeIsFallback(route: RouteData | undefined): boolean;
/**
 * Give a route, it returns its fallback routes from a `list` of `RouteInfo[]`.
 *
 * It throws an error if no fallback routes were found. This means there's an error
 * when we construct the list of routes
 * @param route
 * @param routeList
 */
export declare function getFallbackRoute(route: RouteData, routeList: RouteInfo[]): RouteData;
/**
 * Return a user-provided 404 route if one exists.
 */
export declare function getCustom404Route(manifestData: RoutesList): RouteData | undefined;
/**
 * Return a user-provided 500 route if one exists.
 */
export declare function getCustom500Route(manifestData: RoutesList): RouteData | undefined;
/**
 * Returns true if the route definition contains `.html` as a static segment part,
 * as is the case for routes like `[slug].html.astro`. Used to avoid stripping the
 * `.html` suffix from pathnames that intentionally include it.
 */
export declare function routeHasHtmlExtension(route: RouteData): boolean;
export declare function hasNonPrerenderedRoute(
	routes: Array<Pick<RouteData, 'type' | 'origin' | 'prerender'>>,
	options?: {
		includeEndpoints?: boolean;
		includeExternal?: boolean;
	},
): boolean;
export declare function hasNonPrerenderedRoute(
	routes: Array<Pick<IntegrationResolvedRoute, 'type' | 'origin' | 'isPrerendered'>>,
	options?: {
		includeEndpoints?: boolean;
		includeExternal?: boolean;
	},
): boolean;
export {};
