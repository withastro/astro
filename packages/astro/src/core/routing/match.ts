import type { RoutesList } from '../../types/astro.js';
import type { RouteData } from '../../types/public/internal.js';
import { redirectIsExternal } from '../redirects/render.js';
import { SERVER_ISLAND_COMPONENT } from '../server-islands/endpoint.js';
import { isRoute404, isRoute500 } from './internal/route-errors.js';

/** Find matching route from pathname */
export function matchRoute(pathname: string, manifest: RoutesList): RouteData | undefined {
	return manifest.routes.find((route) => {
		return (
			route.pattern.test(pathname) ||
			route.fallbackRoutes.some((fallbackRoute) => fallbackRoute.pattern.test(pathname))
		);
	});
}

/** Finds all matching routes from pathname */
export function matchAllRoutes(pathname: string, manifest: RoutesList): RouteData[] {
	return manifest.routes.filter((route) => route.pattern.test(pathname));
}

/**
 * Determines if the given route matches a 404 or 500 error page.
 *
 * @param {RouteData} route - The route data to check.
 * @returns {boolean} `true` if the route matches a 404 or 500 error page, otherwise `false`.
 */
export function isRoute404or500(route: RouteData): boolean {
	return isRoute404(route.route) || isRoute500(route.route);
}

/**
 * Determines if a given route is associated with the server island component.
 *
 * @param {RouteData} route - The route data object to evaluate.
 * @return {boolean} Returns true if the route's component is the server island component, otherwise false.
 */
export function isRouteServerIsland(route: RouteData): boolean {
	return route.component === SERVER_ISLAND_COMPONENT;
}

/**
 * Determines whether a given route is an external redirect.
 *
 * @param {RouteData} route - The route object to check.
 * @return {boolean} Returns true if the route is an external redirect, otherwise false.
 */
export function isRouteExternalRedirect(route: RouteData): boolean {
	return !!(route.type === 'redirect' && route.redirect && redirectIsExternal(route.redirect));
}
