import type { RouteData, RedirectRouteData, Params } from '../../@types/astro';

export function routeIsRedirect(route: RouteData | undefined): route is RedirectRouteData {
	return route?.type === 'redirect';
}

export function redirectRouteGenerate(redirectRoute: RouteData, data: Params): string {
	const routeData = redirectRoute.redirectRoute;
	const route = redirectRoute.redirect;

	return routeData?.generate(data) || routeData?.pathname || route || '/';
}
