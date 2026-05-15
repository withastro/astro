import type { CacheProvider } from './types.js';
export interface MemoryCacheQueryOptions {
	/**
	 * Sort query parameters alphabetically so that parameter order does not
	 * affect the cache key. Enabled by default.
	 * @default true
	 */
	sort?: boolean;
	/**
	 * Only include these query parameter names in the cache key.
	 * All other parameters are ignored, including the default tracking
	 * parameter exclusions. Cannot be used together with `exclude`.
	 *
	 * @example
	 * ```js
	 * memoryCache({ query: { include: ['page', 'sort', 'q'] } })
	 * ```
	 */
	include?: string[];
	/**
	 * Exclude query parameters whose names match these patterns from the cache
	 * key. Supports glob wildcards (e.g. `"utm_*"`). Cannot be used together
	 * with `include`.
	 *
	 * By default, common tracking and analytics parameters (`utm_*`, `fbclid`,
	 * `gclid`, etc.) are excluded. Set to `[]` to include all query parameters
	 * in the cache key.
	 *
	 * @default ['utm_*', 'fbclid', 'gclid', 'gbraid', 'wbraid', 'dclid', 'msclkid', 'twclid', 'li_fat_id', 'mc_cid', 'mc_eid', '_ga', '_gl', '_hsenc', '_hsmi', '_ke', 'oly_anon_id', 'oly_enc_id', 'rb_clickid', 's_cid', 'vero_id', 'wickedid', 'yclid', '__s', 'ref']
	 *
	 * @example
	 * ```js
	 * // Only exclude specific params (replaces defaults)
	 * memoryCache({ query: { exclude: ['session_id', 'token'] } })
	 * ```
	 *
	 * @example
	 * ```js
	 * // Include all query parameters (disable default exclusions)
	 * memoryCache({ query: { exclude: [] } })
	 * ```
	 */
	exclude?: string[];
}
export interface MemoryCacheProviderOptions {
	/** Maximum number of entries to keep in cache. Defaults to 1000. */
	max?: number;
	/**
	 * Query parameter handling for cache keys.
	 * By default, parameters are sorted alphabetically so that order does not
	 * affect the cache key.
	 */
	query?: MemoryCacheQueryOptions;
}
declare const memoryProvider: (config: MemoryCacheProviderOptions | undefined) => CacheProvider;
export default memoryProvider;
