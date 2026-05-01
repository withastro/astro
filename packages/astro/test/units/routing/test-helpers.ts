import { getPattern } from '../../../dist/core/routing/pattern.js';
import type { RoutePart, RouteType, RouteData } from '../../../dist/types/public/internal.js';

const staticPart = (content: string): RoutePart => ({ content, dynamic: false, spread: false });
const dynamicPart = (content: string): RoutePart => ({ content, dynamic: true, spread: false });
const spreadPart = (content: string): RoutePart => ({ content, dynamic: true, spread: true });

const makeRoute = ({
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
}: {
	segments: RoutePart[][];
	trailingSlash: 'always' | 'never' | 'ignore';
	route: string;
	pathname: string | undefined;
	type?: RouteType;
	component?: string;
	isIndex?: boolean;
	prerender?: boolean;
	origin?: 'project' | 'internal' | 'external';
	params?: string[];
}): RouteData => {
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
	};
};

export { dynamicPart, makeRoute, spreadPart, staticPart };
