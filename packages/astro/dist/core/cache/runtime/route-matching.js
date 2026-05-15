import { removeLeadingForwardSlash } from '@astrojs/internal-helpers/path';
import { getParts } from '../../routing/parts.js';
import { getPattern } from '../../routing/pattern.js';
import { routeComparator } from '../../routing/priority.js';
function compileCacheRoutes(routes, base, trailingSlash) {
	const compiled = Object.entries(routes).map(([path, options]) => {
		const segments = removeLeadingForwardSlash(path)
			.split('/')
			.filter(Boolean)
			.map((s) => getParts(s, path));
		const pattern = getPattern(segments, base, trailingSlash);
		return { pattern, options, segments, route: path };
	});
	compiled.sort((a, b) =>
		routeComparator(
			{ segments: a.segments, route: a.route, type: 'page' },
			{ segments: b.segments, route: b.route, type: 'page' },
		),
	);
	return compiled;
}
function matchCacheRoute(pathname, compiledRoutes) {
	for (const route of compiledRoutes) {
		if (route.pattern.test(pathname)) return route.options;
	}
	return null;
}
export { compileCacheRoutes, matchCacheRoute };
