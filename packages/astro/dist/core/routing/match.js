import { SERVER_ISLAND_COMPONENT } from '../server-islands/endpoint.js';
import { isRoute404, isRoute500 } from './internal/route-errors.js';
function matchRoute(pathname, manifest) {
	if (isRoute404(pathname)) {
		const errorRoute = manifest.routes.find((route) => isRoute404(route.route));
		if (errorRoute) return errorRoute;
	}
	if (isRoute500(pathname)) {
		const errorRoute = manifest.routes.find((route) => isRoute500(route.route));
		if (errorRoute) return errorRoute;
	}
	return manifest.routes.find((route) => {
		return (
			route.pattern.test(pathname) ||
			route.fallbackRoutes.some((fallbackRoute) => fallbackRoute.pattern.test(pathname))
		);
	});
}
function matchAllRoutes(pathname, manifest) {
	return manifest.routes.filter((route) => route.pattern.test(pathname));
}
function isRoute404or500(route) {
	return isRoute404(route.route) || isRoute500(route.route);
}
function isRouteServerIsland(route) {
	return route.component === SERVER_ISLAND_COMPONENT;
}
export { isRoute404or500, isRouteServerIsland, matchAllRoutes, matchRoute };
