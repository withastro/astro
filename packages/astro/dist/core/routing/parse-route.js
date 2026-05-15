import { fileExtension } from '@astrojs/internal-helpers/path';
import { removeLeadingForwardSlash, removeTrailingForwardSlash } from '../path.js';
import { SUPPORTED_MARKDOWN_FILE_EXTENSIONS } from '../constants.js';
import { getPattern } from './pattern.js';
import { getParts } from './parts.js';
import { validateSegment } from './segment.js';
const ROUTE_FILE_EXTENSIONS = /* @__PURE__ */ new Set([
	'.astro',
	'.md',
	'.mdx',
	'.markdown',
	'.js',
	'.ts',
	...SUPPORTED_MARKDOWN_FILE_EXTENSIONS,
]);
function parseRoute(route, options, parseOptions) {
	const routeFileExtensions = options.pageExtensions?.length
		? /* @__PURE__ */ new Set([...ROUTE_FILE_EXTENSIONS, ...options.pageExtensions])
		: ROUTE_FILE_EXTENSIONS;
	const normalizedRoute = removeTrailingForwardSlash(removeLeadingForwardSlash(route));
	const segments = [];
	const rawSegments = normalizedRoute ? normalizedRoute.split('/') : [];
	let isIndex = parseOptions.isIndex ?? false;
	if (rawSegments.length > 0) {
		const last = rawSegments.at(-1);
		const ext = fileExtension(last);
		if (ext && routeFileExtensions.has(ext)) {
			const base = last.slice(0, -ext.length);
			rawSegments[rawSegments.length - 1] = base;
			if (base === 'index') {
				isIndex = true;
				rawSegments.pop();
			}
		}
	}
	for (const segment of rawSegments) {
		validateSegment(segment, route);
		segments.push(getParts(segment, route));
	}
	const routePath = joinSegments(segments);
	const pathname = segments.every((segment) => segment.length === 1 && !segment[0].dynamic)
		? `/${segments.map((segment) => segment[0].content).join('/')}`
		: null;
	const params =
		parseOptions.params ??
		segments
			.flat()
			.filter((part) => part.dynamic)
			.map((part) => part.content);
	return {
		route: routePath,
		component: parseOptions.component,
		params,
		pathname: pathname || void 0,
		pattern: getPattern(segments, options.config.base, options.config.trailingSlash),
		segments,
		type: parseOptions.type ?? 'page',
		prerender: parseOptions.prerender ?? false,
		fallbackRoutes: [],
		distURL: [],
		isIndex,
		origin: parseOptions.origin ?? 'project',
	};
}
function joinSegments(segments) {
	if (segments.length === 0) return '/';
	const arr = segments.map((segment) => {
		return segment.map((part) => (part.dynamic ? `[${part.content}]` : part.content)).join('');
	});
	return `/${arr.join('/')}`.toLowerCase();
}
export { parseRoute };
