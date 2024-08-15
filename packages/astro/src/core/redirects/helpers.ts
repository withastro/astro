import type { RedirectRouteData } from '../../types/astro.js';
import type { RouteData } from '../../types/public/internal.js';

export function routeIsRedirect(route: RouteData | undefined): route is RedirectRouteData {
	return route?.type === 'redirect';
}

export function routeIsFallback(route: RouteData | undefined): route is RedirectRouteData {
	return route?.type === 'fallback';
}
