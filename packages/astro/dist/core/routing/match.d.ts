import type { RoutesList } from '../../types/astro.js';
import type { RouteData } from '../../types/public/internal.js';
/** Find matching route from pathname */
export declare function matchRoute(pathname: string, manifest: RoutesList): RouteData | undefined;
/** Finds all matching routes from pathname */
export declare function matchAllRoutes(pathname: string, manifest: RoutesList): RouteData[];
/**
 * Determines if the given route matches a 404 or 500 error page.
 *
 * @param {RouteData} route - The route data to check.
 * @returns {boolean} `true` if the route matches a 404 or 500 error page; otherwise, `false`.
 */
export declare function isRoute404or500(route: RouteData): boolean;
/**
 * Determines if a given route is associated with the server island component.
 *
 * @param {RouteData} route - The route data object to evaluate.
 * @return {boolean} Returns true if the route's component is the server island component; otherwise, false.
 */
export declare function isRouteServerIsland(route: RouteData): boolean;
