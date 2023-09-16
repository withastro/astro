import type {
	Params,
	RedirectRouteData,
	RouteData,
	ValidRedirectStatus,
} from '../../@types/astro.js';

export function routeIsRedirect(route: RouteData | undefined): route is RedirectRouteData {
	return route?.type === 'redirect';
}

export function redirectRouteGenerate(redirectRoute: RouteData, data: Params): string {
	const routeData = redirectRoute.redirectRoute;
	const route = redirectRoute.redirect;

	if (typeof routeData !== 'undefined') {
		return routeData?.generate(data) || routeData?.pathname || '/';
	} else if (typeof route === 'string') {
		return route;
	} else if (typeof route === 'undefined') {
		return '/';
	}
	return route.destination;
}

export function redirectRouteStatus(redirectRoute: RouteData, method = 'GET'): ValidRedirectStatus {
	const routeData = redirectRoute.redirectRoute;
	if (typeof routeData?.redirect === 'object') {
		return routeData.redirect.status;
	} else if (method !== 'GET') {
		return 308;
	}
	return 301;
}
