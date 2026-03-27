import { getPattern } from '../../../dist/core/routing/pattern.js';
import type { RouteData, RoutePart } from '../../../dist/types/public/internal.js';
import type { AstroConfig } from '../../../dist/types/public/config.js';

export const staticPart = (content: string): RoutePart => ({
	content,
	dynamic: false,
	spread: false,
});
export const dynamicPart = (content: string): RoutePart => ({
	content,
	dynamic: true,
	spread: false,
});
export const spreadPart = (content: string): RoutePart => ({
	content,
	dynamic: true,
	spread: true,
});

/**
 * makeRoute builds a RouteData from the fields that actually vary between tests.
 * `trailingSlash` is the only extra field not on RouteData itself — it's needed
 * to compute `pattern` via getPattern().
 * All fields except `route`, `segments`, and `trailingSlash` are optional with
 * sensible defaults so callers only need to supply what they actually care about.
 */
export type MakeRouteOptions = {
	/** Used to derive `pattern` via getPattern(). */
	trailingSlash: AstroConfig['trailingSlash'];
	route: RouteData['route'];
	segments: RouteData['segments'];
	pathname?: RouteData['pathname'];
	type?: RouteData['type'];
	component?: RouteData['component'];
	isIndex?: RouteData['isIndex'];
	prerender?: RouteData['prerender'];
	origin?: RouteData['origin'];
	params?: RouteData['params'];
	redirect?: RouteData['redirect'];
	redirectRoute?: RouteData['redirectRoute'];
};

export const makeRoute = ({
	segments,
	trailingSlash,
	route,
	pathname,
	type = 'page',
	component,
	isIndex = false,
	prerender = false,
	origin = 'project',
	params,
	redirect,
	redirectRoute,
}: MakeRouteOptions): RouteData & { component: string } => {
	const routeParams =
		params ??
		segments
			.flat()
			.filter((part) => part.dynamic)
			.map((part) => part.content);

	return {
		route,
		component: component ?? route,
		params: routeParams,
		pathname,
		pattern: getPattern(segments, '/', trailingSlash),
		segments,
		type,
		prerender,
		fallbackRoutes: [],
		distURL: [],
		isIndex,
		origin,
		redirect,
		redirectRoute,
	};
};
