import { collapseDuplicateSlashes } from '@astrojs/internal-helpers/path';
import type { RewritePayload } from '../../types/public/common.js';
import type { AstroConfig } from '../../types/public/config.js';
import type { RouteData } from '../../types/public/internal.js';
import { shouldAppendForwardSlash } from '../build/util.js';
import { originPathnameSymbol } from '../constants.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import type { AstroLogger } from '../logger/core.js';
import {
	appendForwardSlash,
	joinPaths,
	prependForwardSlash,
	removeTrailingForwardSlash,
	trimSlashes,
} from '../path.js';
import { createRequest } from '../request.js';
import { DEFAULT_404_ROUTE } from './internal/astro-designed-error-pages.js';
import { isRoute404, isRoute500 } from './internal/route-errors.js';

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
		newUrl = new URL(collapseDuplicateSlashes(payload), new URL(request.url).origin);
	}

	const { pathname, resolvedUrlPathname } = normalizeRewritePathname(
		newUrl.pathname,
		base,
		trailingSlash,
		buildFormat,
	);
	newUrl.pathname = resolvedUrlPathname;

	const decodedPathname = decodeURI(pathname);

	// Error pages (404/500) take precedence over dynamic routes that might
	// capture the same path (e.g. [locale] matching /404). See #15098.
	if (isRoute404(decodedPathname)) {
		const errorRoute = routes.find((route) => route.route === '/404');
		if (errorRoute) {
			return { routeData: errorRoute, newUrl, pathname: decodedPathname };
		}
	}
	if (isRoute500(decodedPathname)) {
		const errorRoute = routes.find((route) => route.route === '/500');
		if (errorRoute) {
			return { routeData: errorRoute, newUrl, pathname: decodedPathname };
		}
	}

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
				// Remove /index.html or .html from end of distURL and compare with pathname
				// Use pathname (encoded) instead of decodedPathname because url.href is encoded
				if (
					!route.distURL.find(
						(url) =>
							url.href.replace(outDir.toString(), '').replace(/(?:\/index\.html|\.html)$/, '') ===
							trimSlashes(pathname),
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
	logger: AstroLogger,
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

/**
 * Pure function that normalizes a rewrite target pathname by stripping the base,
 * handling trailing slashes, removing `.html` suffixes, and computing the final
 * full URL pathname (with base re-prepended).
 */
export function normalizeRewritePathname(
	urlPathname: string,
	base: AstroConfig['base'],
	trailingSlash: AstroConfig['trailingSlash'],
	buildFormat: AstroConfig['build']['format'],
): { pathname: string; resolvedUrlPathname: string } {
	let pathname = collapseDuplicateSlashes(urlPathname);
	const shouldAppendSlash = shouldAppendForwardSlash(trailingSlash, buildFormat);

	// Special handling for base path
	if (base !== '/') {
		// Check if this is a request to the base path
		const isBasePathRequest =
			urlPathname === base || urlPathname === removeTrailingForwardSlash(base);

		if (isBasePathRequest) {
			pathname = '/';
		} else if (urlPathname.startsWith(base)) {
			// For non-root paths under the base
			pathname = shouldAppendSlash
				? appendForwardSlash(urlPathname)
				: removeTrailingForwardSlash(urlPathname);
			pathname = pathname.slice(base.length);
		}
	}

	// Ensure pathname starts with '/' when needed
	if (!pathname.startsWith('/') && shouldAppendSlash && urlPathname.endsWith('/')) {
		pathname = prependForwardSlash(pathname);
	}

	// If config.build.format = 'file' then pathname includes .html, so we need to remove it
	if (buildFormat === 'file') {
		pathname = pathname.replace(/\.html$/, '');
	}

	// Compute the resolved URL pathname (with base re-prepended)
	let resolvedUrlPathname: string;
	if (base !== '/' && (pathname === '' || pathname === '/') && !shouldAppendSlash) {
		// Special case for root path at base URL with trailingSlash: 'never'
		resolvedUrlPathname = removeTrailingForwardSlash(base);
	} else {
		resolvedUrlPathname = joinPaths(...[base, pathname].filter(Boolean));
	}

	return { pathname, resolvedUrlPathname };
}
