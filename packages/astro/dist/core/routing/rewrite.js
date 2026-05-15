import { collapseDuplicateSlashes } from '@astrojs/internal-helpers/path';
import { shouldAppendForwardSlash } from '../build/util.js';
import { originPathnameSymbol } from '../constants.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
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
function findRouteToRewrite({
	payload,
	routes,
	request,
	trailingSlash,
	buildFormat,
	base,
	outDir,
}) {
	let newUrl = void 0;
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
			if (
				route.params &&
				route.params.length !== 0 &&
				route.distURL &&
				route.distURL.length !== 0
			) {
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
function copyRequest(newUrl, oldRequest, isPrerendered, logger, routePattern) {
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
function setOriginPathname(request, pathname, trailingSlash, buildFormat) {
	if (!pathname) {
		pathname = '/';
	}
	const shouldAppendSlash = shouldAppendForwardSlash(trailingSlash, buildFormat);
	let finalPathname;
	if (pathname === '/') {
		finalPathname = '/';
	} else if (shouldAppendSlash) {
		finalPathname = appendForwardSlash(pathname);
	} else {
		finalPathname = removeTrailingForwardSlash(pathname);
	}
	Reflect.set(request, originPathnameSymbol, encodeURIComponent(finalPathname));
}
function getOriginPathname(request) {
	const origin = Reflect.get(request, originPathnameSymbol);
	if (origin) {
		return decodeURIComponent(origin);
	}
	return new URL(request.url).pathname;
}
function normalizeRewritePathname(urlPathname, base, trailingSlash, buildFormat) {
	let pathname = collapseDuplicateSlashes(urlPathname);
	const shouldAppendSlash = shouldAppendForwardSlash(trailingSlash, buildFormat);
	if (base !== '/') {
		const isBasePathRequest =
			urlPathname === base || urlPathname === removeTrailingForwardSlash(base);
		if (isBasePathRequest) {
			pathname = '/';
		} else if (urlPathname.startsWith(base)) {
			pathname = shouldAppendSlash
				? appendForwardSlash(urlPathname)
				: removeTrailingForwardSlash(urlPathname);
			pathname = pathname.slice(base.length);
		}
	}
	if (!pathname.startsWith('/') && shouldAppendSlash && urlPathname.endsWith('/')) {
		pathname = prependForwardSlash(pathname);
	}
	if (buildFormat === 'file') {
		pathname = pathname.replace(/\.html$/, '');
	}
	let resolvedUrlPathname;
	if (base !== '/' && (pathname === '' || pathname === '/') && !shouldAppendSlash) {
		resolvedUrlPathname = removeTrailingForwardSlash(base);
	} else {
		resolvedUrlPathname = joinPaths(...[base, pathname].filter(Boolean));
	}
	return { pathname, resolvedUrlPathname };
}
export {
	copyRequest,
	findRouteToRewrite,
	getOriginPathname,
	normalizeRewritePathname,
	setOriginPathname,
};
