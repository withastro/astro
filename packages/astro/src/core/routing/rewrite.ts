import type { AstroConfig, RewritePayload, RouteData } from '../../@types/astro.js';
import { shouldAppendForwardSlash } from '../build/util.js';
import { appendForwardSlash, removeTrailingForwardSlash } from '../path.js';
import { DEFAULT_404_ROUTE } from './astro-designed-error-pages.js';

export type FindRouteToRewrite = {
	payload: RewritePayload;
	routes: RouteData[];
	request: Request;
	trailingSlash: AstroConfig['trailingSlash'];
	buildFormat: AstroConfig['build']['format'];
	base: AstroConfig['base'];
};

export function findRouteToRewrite({
	payload,
	routes,
	request,
	trailingSlash,
	buildFormat,
	base,
}: FindRouteToRewrite): [RouteData, URL] {
	let finalUrl: URL | undefined = undefined;
	if (payload instanceof URL) {
		finalUrl = payload;
	} else if (payload instanceof Request) {
		finalUrl = new URL(payload.url);
	} else {
		finalUrl = new URL(payload, new URL(request.url).origin);
	}

	let foundRoute;
	for (const route of routes) {
		const pathname = shouldAppendForwardSlash(trailingSlash, buildFormat)
			? appendForwardSlash(finalUrl.pathname)
			: base !== '/'
				? removeTrailingForwardSlash(finalUrl.pathname)
				: finalUrl.pathname;
		if (route.pattern.test(decodeURI(pathname))) {
			foundRoute = route;
			break;
		}
	}

	if (foundRoute) {
		return [foundRoute, finalUrl];
	} else {
		const custom404 = routes.find((route) => route.route === '/404');
		if (custom404) {
			return [custom404, finalUrl];
		} else {
			return [DEFAULT_404_ROUTE, finalUrl];
		}
	}
}
