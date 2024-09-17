import type { RewritePayload } from '../../types/public/common.js';
import type { AstroConfig } from '../../types/public/config.js';
import type { RouteData } from '../../types/public/internal.js';
import { appendForwardSlash, removeTrailingForwardSlash } from '../path.js';
import { DEFAULT_404_ROUTE } from './astro-designed-error-pages.js';

export type FindRouteToRewrite = {
	payload: RewritePayload;
	routes: RouteData[];
	request: Request;
	trailingSlash: AstroConfig['trailingSlash'];
	base: AstroConfig['base'];
};

export interface FindRouteToRewriteResult {
	routeData: RouteData;
	newUrl: URL;
	pathname: string;
}

/**
 * Shared logic to retrieve the rewritten route. It returns a tuple that represents:
 * 1. The new `Request` object. It contains `base`
 * 2.
 */
export function findRouteToRewrite({
	payload,
	routes,
	request,
	trailingSlash,
	base,
}: FindRouteToRewrite): FindRouteToRewriteResult {
	let newUrl: URL | undefined = undefined;
	if (payload instanceof URL) {
		newUrl = payload;
	} else if (payload instanceof Request) {
		newUrl = new URL(payload.url);
	} else {
		newUrl = new URL(payload, new URL(request.url).origin);
	}
	let pathname = newUrl.pathname;
	if (base !== '/' && newUrl.pathname.startsWith(base)) {
		pathname =
			trailingSlash.page === 'always'
				? appendForwardSlash(newUrl.pathname)
				: removeTrailingForwardSlash(newUrl.pathname);
		pathname = pathname.slice(base.length);
	}

	let foundRoute;
	for (const route of routes) {
		if (route.pattern.test(decodeURI(pathname))) {
			foundRoute = route;
			break;
		}
	}

	if (foundRoute) {
		return {
			routeData: foundRoute,
			newUrl,
			pathname,
		};
	} else {
		const custom404 = routes.find((route) => route.route === '/404');
		if (custom404) {
			return { routeData: custom404, newUrl, pathname };
		} else {
			return { routeData: DEFAULT_404_ROUTE, newUrl, pathname };
		}
	}
}
