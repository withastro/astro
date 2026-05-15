import { isRoute404, isRoute500 } from './internal/route-errors.js';
function routeIsRedirect(route) {
	return route?.type === 'redirect';
}
function routeIsFallback(route) {
	return route?.type === 'fallback';
}
function getFallbackRoute(route, routeList) {
	const fallbackRoute = routeList.find((r) => {
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
function getCustom404Route(manifestData) {
	return manifestData.routes.find((r) => isRoute404(r.route));
}
function getCustom500Route(manifestData) {
	return manifestData.routes.find((r) => isRoute500(r.route));
}
function routeHasHtmlExtension(route) {
	return route.segments.some((segment) =>
		segment.some((part) => !part.dynamic && part.content.includes('.html')),
	);
}
function hasNonPrerenderedRoute(routes, options) {
	const includeEndpoints = options?.includeEndpoints ?? true;
	const includeExternal = options?.includeExternal ?? false;
	const routeTypes = includeEndpoints ? ['page', 'endpoint'] : ['page'];
	const origins = includeExternal ? ['project', 'external'] : ['project'];
	return routes.some((route) => {
		const isPrerendered = 'isPrerendered' in route ? route.isPrerendered : route.prerender;
		return routeTypes.includes(route.type) && origins.includes(route.origin) && !isPrerendered;
	});
}
export {
	getCustom404Route,
	getCustom500Route,
	getFallbackRoute,
	hasNonPrerenderedRoute,
	routeHasHtmlExtension,
	routeIsFallback,
	routeIsRedirect,
};
