import type { RouteData } from '../../@types/astro.js';

/** Find matching route from pathname */
export function matchRoute(pathname: string, routes: RouteData[]): RouteData | undefined {
	const decodedPathname = decodeURI(pathname);
	return routes.find(
		(route) =>
			route.pattern.test(decodedPathname) ||
			route.fallbackRoutes.some((fallbackRoute) => fallbackRoute.pattern.test(decodedPathname))
	);
}

/** Finds all matching routes from pathname */
export function matchAllRoutes(pathname: string, routes: RouteData[]): RouteData[] {
	return routes.filter((route) => route.pattern.test(decodeURI(pathname)));
}
