import type { ComponentInstance, Params, Props, RouteData } from '../../@types/astro';
import { AstroError, AstroErrorData } from '../errors/index.js';
import type { LogOptions } from '../logger/core.js';
import { getParams } from '../routing/params.js';
import { callGetStaticPaths, findPathItemByKey, RouteCache } from './route-cache.js';

interface GetParamsAndPropsOptions {
	mod: ComponentInstance;
	route?: RouteData | undefined;
	routeCache: RouteCache;
	pathname: string;
	logging: LogOptions;
	ssr: boolean;
}

export const enum GetParamsAndPropsError {
	NoMatchingStaticPath,
}

/**
 * It retrieves `Params` and `Props`, or throws an error
 * if they are not correctly retrieved.
 */
export async function getParamsAndPropsOrThrow(
	options: GetParamsAndPropsOptions
): Promise<[Params, Props]> {
	let paramsAndPropsResp = await getParamsAndProps(options);
	if (paramsAndPropsResp === GetParamsAndPropsError.NoMatchingStaticPath) {
		throw new AstroError({
			...AstroErrorData.NoMatchingStaticPathFound,
			message: AstroErrorData.NoMatchingStaticPathFound.message(options.pathname),
			hint: options.route?.component
				? AstroErrorData.NoMatchingStaticPathFound.hint([options.route?.component])
				: '',
		});
	}
	return paramsAndPropsResp;
}

export async function getParamsAndProps(
	opts: GetParamsAndPropsOptions
): Promise<[Params, Props] | GetParamsAndPropsError> {
	const { logging, mod, route, routeCache, pathname, ssr } = opts;
	// Handle dynamic routes
	let params: Params = {};
	let pageProps: Props;
	if (route && !route.pathname) {
		if (route.params.length) {
			// The RegExp pattern expects a decoded string, but the pathname is encoded
			// when the URL contains non-English characters.
			const paramsMatch = route.pattern.exec(decodeURIComponent(pathname));
			if (paramsMatch) {
				params = getParams(route.params)(paramsMatch);
			}
		}
		validatePrerenderEndpointCollision(route, mod, params);
		let routeCacheEntry = routeCache.get(route);
		// During build, the route cache should already be populated.
		// During development, the route cache is filled on-demand and may be empty.
		// TODO(fks): Can we refactor getParamsAndProps() to receive routeCacheEntry
		// as a prop, and not do a live lookup/populate inside this lower function call.
		if (!routeCacheEntry) {
			routeCacheEntry = await callGetStaticPaths({ mod, route, isValidate: true, logging, ssr });
			routeCache.set(route, routeCacheEntry);
		}
		const matchedStaticPath = findPathItemByKey(routeCacheEntry.staticPaths, params, route);
		if (!matchedStaticPath && (ssr ? route.prerender : true)) {
			return GetParamsAndPropsError.NoMatchingStaticPath;
		}
		// Note: considered using Object.create(...) for performance
		// Since this doesn't inherit an object's properties, this caused some odd user-facing behavior.
		// Ex. console.log(Astro.props) -> {}, but console.log(Astro.props.property) -> 'expected value'
		// Replaced with a simple spread as a compromise
		pageProps = matchedStaticPath?.props ? { ...matchedStaticPath.props } : {};
	} else {
		pageProps = {};
	}
	return [params, pageProps];
}

/**
 * If we have an endpoint at `src/pages/api/[slug].ts` that's prerendered, and the `slug`
 * is `undefined`, throw an error as we can't generate the `/api` file and `/api` directory
 * at the same time. Using something like `[slug].json.ts` instead will work.
 */
function validatePrerenderEndpointCollision(
	route: RouteData,
	mod: ComponentInstance,
	params: Params
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
