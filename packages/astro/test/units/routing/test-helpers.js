import { getPattern } from '../../../dist/core/routing/manifest/pattern.js';

const staticPart = (content) => ({ content, dynamic: false, spread: false });
const dynamicPart = (content) => ({ content, dynamic: true, spread: false });
const spreadPart = (content) => ({ content, dynamic: true, spread: true });

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
}) => {
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
