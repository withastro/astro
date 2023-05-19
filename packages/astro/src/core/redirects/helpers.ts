import type { RouteData, RedirectRouteData } from '../../@types/astro';

export function routeIsRedirect(route: RouteData | undefined): route is RedirectRouteData {
	return route?.type === 'redirect';
}
