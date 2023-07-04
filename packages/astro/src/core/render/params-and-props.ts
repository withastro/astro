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

export async function getParamsAndProps(opts: GetParamsAndPropsOptions): Promise<[Params, Props]> {
	const { logging, mod, route, routeCache, pathname, ssr } = opts;

	// If there's no route, or if there's a pathname (e.g. a static `src/pages/normal.astro` file),
	// then we know for sure they don't have params and props, return a fallback value.
	if (!route || route.pathname) {
		return [{}, {}];
	}

	// This is a dynamic route, start getting the params
	const params = getRouteParams(route, pathname) ?? {};

	validatePrerenderEndpointCollision(route, mod, params);

	// During build, the route cache should already be populated.
	// During development, the route cache is filled on-demand and may be empty.
	const staticPaths = await callGetStaticPaths({
		mod,
		route,
		routeCache,
		isValidate: true,
		logging,
		ssr,
	});

	const matchedStaticPath = findPathItemByKey(staticPaths, params, route);
	if (!matchedStaticPath && (ssr ? route.prerender : true)) {
		throw new AstroError({
			...AstroErrorData.NoMatchingStaticPathFound,
			message: AstroErrorData.NoMatchingStaticPathFound.message(pathname),
			hint: AstroErrorData.NoMatchingStaticPathFound.hint([route.component]),
		});
	}

	const props: Props = matchedStaticPath?.props ? { ...matchedStaticPath.props } : {};

	return [params, props];
}

function getRouteParams(route: RouteData, pathname: string): Params | undefined {
	if (route.params.length) {
		// The RegExp pattern expects a decoded string, but the pathname is encoded
		// when the URL contains non-English characters.
		const paramsMatch = route.pattern.exec(decodeURIComponent(pathname));
		if (paramsMatch) {
			return getParams(route.params)(paramsMatch);
		}
	}
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
