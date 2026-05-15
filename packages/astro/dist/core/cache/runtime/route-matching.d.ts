import type { AstroConfig } from '../../../types/public/config.js';
import type { RoutePart } from '../../../types/public/internal.js';
import type { CacheOptions } from '../types.js';
export interface CompiledCacheRoute {
	pattern: RegExp;
	options: CacheOptions;
	segments: RoutePart[][];
	route: string;
}
/**
 * Compile config-level cache route patterns into RegExps.
 * The result is memoized on the pipeline — this function is only called once,
 * on the first request that needs route matching.
 * Returns compiled patterns sorted by Astro's standard route priority (most specific first).
 */
export declare function compileCacheRoutes(
	routes: Record<string, CacheOptions>,
	base: AstroConfig['base'],
	trailingSlash: AstroConfig['trailingSlash'],
): CompiledCacheRoute[];
/**
 * Called per-request to find the first matching cache rule for a given pathname.
 */
export declare function matchCacheRoute(
	pathname: string,
	compiledRoutes: CompiledCacheRoute[],
): CacheOptions | null;
