import type { RedirectRouteData, RouteData } from '../../@types/astro.js';

export function routeIsRedirect(route: RouteData | undefined): route is RedirectRouteData {
	return route?.type === 'redirect';
}

export function routeIsFallback(route: RouteData | undefined): route is RedirectRouteData {
	return route?.type === 'fallback';
}
