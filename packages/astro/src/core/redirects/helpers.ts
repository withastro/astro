import type { RouteData } from '../../types/public/internal.js';

type RedirectRouteData = RouteData & {
	redirect: string;
	redirectRoute: RouteData;
};

export function routeIsRedirect(route: RouteData | undefined): route is RedirectRouteData {
	return route?.type === 'redirect';
}

export function routeIsFallback(route: RouteData | undefined): route is RedirectRouteData {
	return route?.type === 'fallback';
}
