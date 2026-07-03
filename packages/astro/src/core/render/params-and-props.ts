import type { ComponentInstance } from '../../types/astro.js';
import type { Params, Props } from '../../types/public/common.js';
import type { AstroConfig } from '../../types/public/index.js';
import type { RouteData } from '../../types/public/internal.js';
import { DEFAULT_404_COMPONENT } from '../constants.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import type { AstroLogger } from '../logger/core.js';
import { routeHasHtmlExtension, routeIsFallback, routeIsRedirect } from '../routing/helpers.js';
import type { RouteCache } from './route-cache.js';
import { callGetStaticPaths, findPathItemByKey } from './route-cache.js';

interface GetParamsAndPropsOptions {
	mod: ComponentInstance | undefined;
	routeData?: RouteData | undefined;
	routeCache: RouteCache;
	pathname: string;
	logger: AstroLogger;
	serverLike: boolean;
	base: string;
	trailingSlash: AstroConfig['trailingSlash'];
}

export async function getProps(opts: GetParamsAndPropsOptions): Promise<Props> {
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

	// If there's no route, or if there's a pathname (e.g. a static `src/pages/normal.astro` file),
	// then we know for sure they don't have params and props, return a fallback value.
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

	// During build, the route cache should already be populated.
	// During development, the route cache is filled on-demand and may be empty.
	const staticPaths = await callGetStaticPaths({
		mod,
		route,
		routeCache,
		ssr: serverLike,
		base,
		trailingSlash,
	});

	// The pathname used here comes from the server, which already encoded.
	// Since we decided to not mess up with encoding anymore, we need to decode them back so the parameters can match
	// the ones expected from the users
	const params = getParams(route, pathname);
	const matchedStaticPath = findPathItemByKey(staticPaths, params, route, logger, trailingSlash);
	if (!matchedStaticPath && route.origin !== 'internal' && (serverLike ? route.prerender : true)) {
		throw new AstroError({
			...AstroErrorData.NoMatchingStaticPathFound,
			message: AstroErrorData.NoMatchingStaticPathFound.message(pathname),
			hint: AstroErrorData.NoMatchingStaticPathFound.hint([route.component]),
		});
	}

	if (mod) {
		validatePrerenderEndpointCollision(route, mod, params);
	}

	const props: Props = matchedStaticPath?.props ? { ...matchedStaticPath.props } : {};

	return props;
}

/**
 * When given a route with the pattern `/[x]/[y]/[z]/svelte`, and a pathname `/a/b/c/svelte`,
 * returns the params object: { x: "a", y: "b", z: "c" }.
 */
export function getParams(route: RouteData, pathname: string): Params {
	if (!route.params.length) return {};
	// The RegExp pattern expects a decoded string, but the pathname is encoded
	// when the URL contains non-English characters.
	// Strip `.html` from the pathname of page routes unless `.html` is a static part of the
	// route definition itself (e.g. `[slug].html.astro`). Dynamic params like `[id]` would
	// otherwise greedily capture the `.html` suffix that is either implied or injected
	// for page routes (e.g. `id = '42.html'` instead of `id = '42'`).
	// For non-page routes (endpoints), first try matching the original pathname. If that
	// fails, fall back to stripping `.html` / `/index.html` to stay consistent with the
	// dev route matcher which also strips these suffixes when retrying (see `dev.ts`).
	// Without this fallback, requests like `/api/items/123/status.html` would match a
	// dynamic endpoint route but fail to extract params, causing a "Missing parameter" error.
	let path = pathname;
	if (pathname.endsWith('.html') && !routeHasHtmlExtension(route)) {
		if (route.type === 'page') {
			path = pathname.slice(0, -5);
		}
	}

	const allPatterns = [route, ...route.fallbackRoutes].map((r) => r.pattern);
	let paramsMatch = allPatterns.map((pattern) => pattern.exec(path)).find((x) => x);

	// For non-page routes, if the original pathname didn't match, try stripping
	// `.html` or `/index.html` as the dev router does when retrying.
	if (!paramsMatch && route.type !== 'page' && !routeHasHtmlExtension(route)) {
		if (pathname.endsWith('/index.html')) {
			path = pathname.slice(0, -'/index.html'.length) || '/';
		} else if (pathname.endsWith('.html')) {
			path = pathname.slice(0, -'.html'.length);
		}
		paramsMatch = allPatterns.map((pattern) => pattern.exec(path)).find((x) => x);
	}

	if (!paramsMatch) return {};
	const params: Params = {};
	route.params.forEach((key, i) => {
		if (key.startsWith('...')) {
			params[key.slice(3)] = paramsMatch[i + 1] ? paramsMatch[i + 1] : undefined;
		} else {
			params[key] = paramsMatch[i + 1];
		}
	});
	return params;
}

/**
 * If we have an endpoint at `src/pages/api/[slug].ts` that's prerendered, and the `slug`
 * is `undefined`, throw an error as we can't generate the `/api` file and `/api` directory
 * at the same time. Using something like `[slug].json.ts` instead will work.
 */
function validatePrerenderEndpointCollision(
	route: RouteData,
	mod: ComponentInstance,
	params: Params,
) {
	if (route.type === 'endpoint' && mod.getStaticPaths) {
		const lastSegment = route.segments[route.segments.length - 1];
		const paramValues = Object.values(params);
		const lastParam = paramValues[paramValues.length - 1];
		// Check last segment is solely `[slug]` or `[...slug]` case (dynamic). Make sure it's not
		// `foo[slug].js` by checking segment length === 1. Also check here if that param is undefined.
		if (lastSegment.length === 1 && lastSegment[0].dynamic && lastParam === undefined) {
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
