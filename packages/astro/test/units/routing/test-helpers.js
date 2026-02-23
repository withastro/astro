import { getPattern } from '../../../dist/core/routing/pattern.js';

/** @param {string} content */
const staticPart = (content) => ({ content, dynamic: false, spread: false });
/** @param {string} content */
const dynamicPart = (content) => ({ content, dynamic: true, spread: false });
/** @param {string} content */
const spreadPart = (content) => ({ content, dynamic: true, spread: true });

/**
 * @param {object} options
 * @param {import('../../../dist/types/public/internal.js').RoutePart[][]} options.segments
 * @param {'always' | 'never' | 'ignore'} options.trailingSlash
 * @param {string} options.route
 * @param {string | undefined} options.pathname
 * @param {'page' | 'endpoint' | 'redirect' | 'fallback'} [options.type]
 * @param {string | undefined} [options.component]
 * @param {boolean} [options.isIndex]
 * @param {boolean} [options.prerender]
 * @param {'project' | 'internal'} [options.origin]
 * @param {string[] | undefined} [options.params]
 */
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
