import type { RedirectRouteData, RouteData } from '../../@types/astro.js';

export function routeIsRedirect(route: RouteData | undefined): route is RedirectRouteData {
	return route?.type === 'redirect';
}

export function routeIsVirtual(route: RouteData | undefined): route is RedirectRouteData {
	return route?.type === 'virtual';
}
