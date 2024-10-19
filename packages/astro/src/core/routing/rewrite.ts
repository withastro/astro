import type { AstroConfig, RewritePayload, RouteData } from '../../@types/astro.js';
import { shouldAppendForwardSlash } from '../build/util.js';
import { originPathnameSymbol } from '../constants.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
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
	buildFormat,
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
		pathname = shouldAppendForwardSlash(trailingSlash, buildFormat)
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

/**
 * Utility function that creates a new `Request` with a new URL from an old `Request`.
 *
 * @param newUrl The new `URL`
 * @param oldRequest The old `Request`
 */
export function copyRequest(newUrl: URL, oldRequest: Request): Request {
	if (oldRequest.bodyUsed) {
		throw new AstroError(AstroErrorData.RewriteWithBodyUsed);
	}
	return new Request(newUrl, {
		method: oldRequest.method,
		headers: oldRequest.headers,
		body: oldRequest.body,
		referrer: oldRequest.referrer,
		referrerPolicy: oldRequest.referrerPolicy,
		mode: oldRequest.mode,
		credentials: oldRequest.credentials,
		cache: oldRequest.cache,
		redirect: oldRequest.redirect,
		integrity: oldRequest.integrity,
		signal: oldRequest.signal,
		keepalive: oldRequest.keepalive,
		// https://fetch.spec.whatwg.org/#dom-request-duplex
		// @ts-expect-error It isn't part of the types, but undici accepts it and it allows to carry over the body to a new request
		duplex: 'half',
	});
}

export function setOriginPathname(request: Request, pathname: string): void {
	Reflect.set(request, originPathnameSymbol, encodeURIComponent(pathname));
}

export function getOriginPathname(request: Request): string | undefined {
	const origin = Reflect.get(request, originPathnameSymbol);
	if (origin) {
		return decodeURIComponent(origin);
	}
	return undefined;
}
