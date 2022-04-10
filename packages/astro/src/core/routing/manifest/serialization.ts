import type { RouteData, SerializedRouteData, RoutePart } from '../../../@types/astro';

function createRouteData(
	pattern: RegExp,
	params: string[],
	component: string,
	pathname: string | undefined,
	type: 'page' | 'endpoint',
	segments: RoutePart[][]
): RouteData {
	return {
		type,
		pattern,
		params,
		component,
		// TODO bring back
		generate: () => '',
		pathname: pathname || undefined,
		segments,
	};
}

export function serializeRouteData(routeData: RouteData): SerializedRouteData {
	// Is there a better way to do this in TypeScript?
	const outRouteData = routeData as unknown as SerializedRouteData;
	outRouteData.pattern = routeData.pattern.source;
	return outRouteData;
}

export function deserializeRouteData(rawRouteData: SerializedRouteData) {
	const { component, params, pathname, type, segments } = rawRouteData;
	const pattern = new RegExp(rawRouteData.pattern);
	return createRouteData(pattern, params, component, pathname, type, segments);
}
