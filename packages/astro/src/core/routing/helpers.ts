import type { RouteData } from '../../types/public/internal.js';
import type { RouteInfo } from '../app/types.js';
import type { RoutesList } from '../../types/astro.js';
import { isRoute404, isRoute500 } from './match.js';

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

export function getCustom404Route(manifestData: RoutesList): RouteData | undefined {
	return manifestData.routes.find((r) => isRoute404(r.route));
}

export function getCustom500Route(manifestData: RoutesList): RouteData | undefined {
	return manifestData.routes.find((r) => isRoute500(r.route));
}
