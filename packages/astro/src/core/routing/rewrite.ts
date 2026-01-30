import type { RewritePayload } from '../../types/public/common.js';
import type { AstroConfig } from '../../types/public/config.js';
import type { RouteData } from '../../types/public/internal.js';
import { shouldAppendForwardSlash } from '../build/util.js';
import { originPathnameSymbol } from '../constants.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import type { Logger } from '../logger/core.js';
import {
	appendForwardSlash,
	joinPaths,
	prependForwardSlash,
	removeTrailingForwardSlash,
	trimSlashes,
} from '../path.js';
import { createRequest } from '../request.js';
import { DEFAULT_404_ROUTE } from './astro-designed-error-pages.js';

type FindRouteToRewrite = {
	payload: RewritePayload;
	routes: RouteData[];
	request: Request;
	trailingSlash: AstroConfig['trailingSlash'];
	buildFormat: AstroConfig['build']['format'];
	base: AstroConfig['base'];
	outDir: URL | string;
};

interface FindRouteToRewriteResult {
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
	outDir,
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
	const shouldAppendSlash = shouldAppendForwardSlash(trailingSlash, buildFormat);

	// Special handling for base path
	if (base !== '/') {
		// Check if this is a request to the base path
		const isBasePathRequest =
			newUrl.pathname === base || newUrl.pathname === removeTrailingForwardSlash(base);

		if (isBasePathRequest) {
			// For root path requests at the base URL
			// When trailingSlash is 'never', we should match '' (empty string pathname)
			// When trailingSlash is 'always', we should match '/' pathname
			pathname = shouldAppendSlash ? '/' : '';
		} else if (newUrl.pathname.startsWith(base)) {
			// For non-root paths under the base
			pathname = shouldAppendSlash
				? appendForwardSlash(newUrl.pathname)
				: removeTrailingForwardSlash(newUrl.pathname);
			pathname = pathname.slice(base.length);
		}
	}

	// Ensure pathname starts with '/' when needed
	if (!pathname.startsWith('/') && shouldAppendSlash && newUrl.pathname.endsWith('/')) {
		pathname = prependForwardSlash(pathname);
	}

	// Convert '/' to '' for trailingSlash: 'never'
	if (pathname === '/' && base !== '/' && !shouldAppendSlash) {
		pathname = '';
	}
	// If config.build.format = 'file' then pathname includes .html, so we need to remove it
	if (buildFormat === 'file') {
		pathname = pathname.replace(/\.html$/, '');
	}
	// Set the final URL pathname
	if (base !== '/' && (pathname === '' || pathname === '/') && !shouldAppendSlash) {
		// Special case for root path at base URL with trailingSlash: 'never'
		newUrl.pathname = removeTrailingForwardSlash(base);
	} else {
		newUrl.pathname = joinPaths(...[base, pathname].filter(Boolean));
	}

	const decodedPathname = decodeURI(pathname);
	let foundRoute;
	for (const route of routes) {
		if (route.pattern.test(decodedPathname)) {
			// If it's a dynamic route, make sure it actually generates the pathname
			// Checking for params to make sure it's a dynamic route
			if (
				route.params &&
				route.params.length !== 0 &&
				route.distURL &&
				route.distURL.length !== 0
			) {
				// Remove outDir from beginning of distURL
				// Remove /index.html or .html from end of distURL and compare with decodedPathname
				if (
					!route.distURL.find(
						(url) =>
							url.href.replace(outDir.toString(), '').replace(/(?:\/index\.html|\.html)$/, '') ==
							trimSlashes(decodedPathname),
					)
				) {
					continue;
				}
			}
			foundRoute = route;
			break;
		}
	}

	if (foundRoute) {
		return {
			routeData: foundRoute,
			newUrl,
			pathname: decodedPathname,
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
 * @param isPrerendered It needs to be the flag of the previous routeData, before the rewrite
 * @param logger
 * @param routePattern
 */
export function copyRequest(
	newUrl: URL,
	oldRequest: Request,
	isPrerendered: boolean,
	logger: Logger,
	routePattern: string,
): Request {
	if (oldRequest.bodyUsed) {
		throw new AstroError(AstroErrorData.RewriteWithBodyUsed);
	}
	return createRequest({
		url: newUrl,
		method: oldRequest.method,
		body: oldRequest.body,
		isPrerendered,
		logger,
		headers: isPrerendered ? {} : oldRequest.headers,
		routePattern,
		init: {
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
		},
	});
}

export function setOriginPathname(
	request: Request,
	pathname: string,
	trailingSlash: AstroConfig['trailingSlash'],
	buildFormat: AstroConfig['build']['format'],
): void {
	// Handle undefined pathname
	if (!pathname) {
		pathname = '/';
	}

	// Apply trailing slash logic based on configuration
	const shouldAppendSlash = shouldAppendForwardSlash(trailingSlash, buildFormat);
	let finalPathname: string;

	// Special handling for root path
	if (pathname === '/') {
		// Root path always keeps the slash
		finalPathname = '/';
	} else if (shouldAppendSlash) {
		finalPathname = appendForwardSlash(pathname);
	} else {
		finalPathname = removeTrailingForwardSlash(pathname);
	}

	Reflect.set(request, originPathnameSymbol, encodeURIComponent(finalPathname));
}

export function getOriginPathname(request: Request): string {
	const origin = Reflect.get(request, originPathnameSymbol);
	if (origin) {
		return decodeURIComponent(origin);
	}
	return new URL(request.url).pathname;
}
