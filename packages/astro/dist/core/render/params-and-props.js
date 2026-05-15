import { DEFAULT_404_COMPONENT } from '../constants.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { routeHasHtmlExtension, routeIsFallback, routeIsRedirect } from '../routing/helpers.js';
import { callGetStaticPaths, findPathItemByKey } from './route-cache.js';
async function getProps(opts) {
	const {
		logger,
		mod,
		routeData: route,
		routeCache,
		pathname,
		serverLike,
		base,
		trailingSlash,
	} = opts;
	if (!route || route.pathname) {
		return {};
	}
	if (
		routeIsRedirect(route) ||
		routeIsFallback(route) ||
		route.component === DEFAULT_404_COMPONENT
	) {
		return {};
	}
	const staticPaths = await callGetStaticPaths({
		mod,
		route,
		routeCache,
		ssr: serverLike,
		base,
		trailingSlash,
	});
	const params = getParams(route, pathname);
	const matchedStaticPath = findPathItemByKey(staticPaths, params, route, logger, trailingSlash);
	if (!matchedStaticPath && (serverLike ? route.prerender : true)) {
		throw new AstroError({
			...AstroErrorData.NoMatchingStaticPathFound,
			message: AstroErrorData.NoMatchingStaticPathFound.message(pathname),
			hint: AstroErrorData.NoMatchingStaticPathFound.hint([route.component]),
		});
	}
	if (mod) {
		validatePrerenderEndpointCollision(route, mod, params);
	}
	const props = matchedStaticPath?.props ? { ...matchedStaticPath.props } : {};
	return props;
}
function getParams(route, pathname) {
	if (!route.params.length) return {};
	const path =
		pathname.endsWith('.html') && route.type === 'page' && !routeHasHtmlExtension(route)
			? pathname.slice(0, -5)
			: pathname;
	const allPatterns = [route, ...route.fallbackRoutes].map((r) => r.pattern);
	const paramsMatch = allPatterns.map((pattern) => pattern.exec(path)).find((x) => x);
	if (!paramsMatch) return {};
	const params = {};
	route.params.forEach((key, i) => {
		if (key.startsWith('...')) {
			params[key.slice(3)] = paramsMatch[i + 1] ? paramsMatch[i + 1] : void 0;
		} else {
			params[key] = paramsMatch[i + 1];
		}
	});
	return params;
}
function validatePrerenderEndpointCollision(route, mod, params) {
	if (route.type === 'endpoint' && mod.getStaticPaths) {
		const lastSegment = route.segments[route.segments.length - 1];
		const paramValues = Object.values(params);
		const lastParam = paramValues[paramValues.length - 1];
		if (lastSegment.length === 1 && lastSegment[0].dynamic && lastParam === void 0) {
			throw new AstroError({
				...AstroErrorData.PrerenderDynamicEndpointPathCollide,
				message: AstroErrorData.PrerenderDynamicEndpointPathCollide.message(route.route),
				hint: AstroErrorData.PrerenderDynamicEndpointPathCollide.hint(route.component),
				location: {
					file: route.component,
				},
			});
		}
	}
}
export { getParams, getProps };
