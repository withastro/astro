import { posix } from 'node:path';
import { removeLeadingForwardSlash } from '@astrojs/internal-helpers/path';
import type { AstroConfig } from '../../types/public/config.js';
import type { RoutePart } from '../../types/public/internal.js';
import { getParts } from '../routing/manifest/parts.js';
import { getPattern } from '../routing/manifest/pattern.js';
import { routeComparator } from '../routing/priority.js';
import type { CacheOptions } from './types.js';

export interface CompiledCacheRoute {
	pattern: RegExp;
	options: CacheOptions;
	segments: RoutePart[][];
	route: string;
}

/**
 * Called once at startup to compile config-level cache route patterns.
 * Returns compiled patterns sorted by Astro's standard route priority (most specific first).
 */
export function compileCacheRoutes(
	routes: Record<string, CacheOptions>,
	base: string,
	trailingSlash: AstroConfig['trailingSlash'],
): CompiledCacheRoute[] {
	const compiled = Object.entries(routes).map(([path, options]) => {
		const segments = removeLeadingForwardSlash(path)
			.split(posix.sep)
			.filter(Boolean)
			.map((s: string) => getParts(s, path));
		const pattern = getPattern(segments, base, trailingSlash);
		return { pattern, options, segments, route: path };
	});
	// Sort using Astro's standard route priority comparator
	// routeComparator expects objects with `segments`, `route`, and `type`
	compiled.sort((a, b) =>
		routeComparator(
			{ segments: a.segments, route: a.route, type: 'page' } as any,
			{ segments: b.segments, route: b.route, type: 'page' } as any,
		),
	);
	return compiled;
}

/**
 * Called per-request to find the first matching cache rule for a given pathname.
 */
export function matchCacheRoute(
	pathname: string,
	compiledRoutes: CompiledCacheRoute[],
): CacheOptions | null {
	for (const route of compiledRoutes) {
		if (route.pattern.test(pathname)) return route.options;
	}
	return null;
}
