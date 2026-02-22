import path from 'node:path';
import type { AstroConfig } from '../../types/public/config.js';
import type { RouteData, RoutePart } from '../../types/public/internal.js';
import { removeLeadingForwardSlash, removeTrailingForwardSlash } from '../path.js';
import { SUPPORTED_MARKDOWN_FILE_EXTENSIONS } from '../constants.js';
import { getPattern } from './pattern.js';
import { getParts } from './parts.js';
import { validateSegment } from './segment.js';

type ParseRouteConfig = Pick<AstroConfig, 'base' | 'trailingSlash'>;

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

export function parseRoute(
	route: string,
	config: ParseRouteConfig,
	options: ParseRouteOptions,
): RouteData {
	const normalizedRoute = removeTrailingForwardSlash(removeLeadingForwardSlash(route));
	const segments: RoutePart[][] = [];
	const rawSegments = normalizedRoute ? normalizedRoute.split('/') : [];
	let isIndex = options.isIndex ?? false;

	if (rawSegments.length > 0) {
		const last = rawSegments[rawSegments.length - 1];
		const ext = path.extname(last);
		if (ext && ROUTE_FILE_EXTENSIONS.has(ext)) {
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
		options.params ??
		segments
			.flat()
			.filter((part) => part.dynamic)
			.map((part) => part.content);

	return {
		route: routePath,
		component: options.component,
		params,
		pathname: pathname || undefined,
		pattern: getPattern(segments, config.base, config.trailingSlash),
		segments,
		type: options.type ?? 'page',
		prerender: options.prerender ?? false,
		fallbackRoutes: [],
		distURL: [],
		isIndex,
		origin: options.origin ?? 'project',
	};
}

function joinSegments(segments: RoutePart[][]): string {
	if (segments.length === 0) return '/';
	const arr = segments.map((segment) => {
		return segment.map((part) => (part.dynamic ? `[${part.content}]` : part.content)).join('');
	});

	return `/${arr.join('/')}`.toLowerCase();
}
