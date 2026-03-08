import type { AstroSettings } from '../../types/astro.js';
import type { RouteData, RoutePart } from '../../types/public/internal.js';
import { fileExtension } from '@astrojs/internal-helpers/path';
import { removeLeadingForwardSlash, removeTrailingForwardSlash } from '../path.js';
import { SUPPORTED_MARKDOWN_FILE_EXTENSIONS } from '../constants.js';
import { getPattern } from './pattern.js';
import { getParts } from './parts.js';
import { validateSegment } from './segment.js';

/**
 * Settings needed to parse a route path into RouteData.
 */
type ParseRouteConfig = Pick<AstroSettings, 'config' | 'pageExtensions'>;

/**
 * Options for building the RouteData output.
 */
type ParseRouteOptions = {
	component: string;
	type?: RouteData['type'];
	origin?: RouteData['origin'];
	isIndex?: boolean;
	prerender?: boolean;
	params?: string[];
};

const ROUTE_FILE_EXTENSIONS = new Set([
	'.astro',
	'.md',
	'.mdx',
	'.markdown',
	'.js',
	'.ts',
	...SUPPORTED_MARKDOWN_FILE_EXTENSIONS,
]);

/**
 * Parse a file path-like route into RouteData, respecting extensions and config.
 */
export function parseRoute(
	route: string,
	options: ParseRouteConfig,
	parseOptions: ParseRouteOptions,
): RouteData {
	const routeFileExtensions = options.pageExtensions?.length
		? new Set([...ROUTE_FILE_EXTENSIONS, ...options.pageExtensions])
		: ROUTE_FILE_EXTENSIONS;
	const normalizedRoute = removeTrailingForwardSlash(removeLeadingForwardSlash(route));
	const segments: RoutePart[][] = [];
	const rawSegments = normalizedRoute ? normalizedRoute.split('/') : [];
	let isIndex = parseOptions.isIndex ?? false;

	if (rawSegments.length > 0) {
		const last = rawSegments.at(-1)!;
		const ext = fileExtension(last);
		if (ext && routeFileExtensions.has(ext)) {
			// Strip known file extensions and treat trailing /index.* as the parent route.
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
		pathname: pathname || undefined,
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

function joinSegments(segments: RoutePart[][]): string {
	if (segments.length === 0) return '/';
	const arr = segments.map((segment) => {
		return segment.map((part) => (part.dynamic ? `[${part.content}]` : part.content)).join('');
	});

	return `/${arr.join('/')}`.toLowerCase();
}
