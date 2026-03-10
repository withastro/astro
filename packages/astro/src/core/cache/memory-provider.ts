import picomatch from 'picomatch';
import { AstroError } from '../errors/errors.js';
import { CacheQueryConfigConflict } from '../errors/errors-data.js';
import type { CacheProvider, CacheProviderFactory, InvalidateOptions } from './types.js';

interface CachedEntry {
	body: ArrayBuffer;
	status: number;
	headers: [string, string][];
	/** Absolute timestamp (ms) when the entry was stored */
	storedAt: number;
	/** max-age in seconds from CDN-Cache-Control */
	maxAge: number;
	/** stale-while-revalidate window in seconds */
	swr: number;
	/** Tags for invalidation */
	tags: string[];
	/** Headers from the Vary response header (lowercased), used for cache key discrimination */
	vary?: string[];
	/** Snapshot of request header values for the Vary'd headers, used to match subsequent requests */
	varyValues?: Record<string, string>;
}

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

/**
 * Parse CDN-Cache-Control directives from a header value.
 * Returns maxAge and swr in seconds.
 */
function parseCdnCacheControl(header: string | null): { maxAge: number; swr: number } {
	let maxAge = 0;
	let swr = 0;
	if (!header) return { maxAge, swr };

	for (const part of header.split(',')) {
		const trimmed = part.trim().toLowerCase();
		if (trimmed.startsWith('max-age=')) {
			maxAge = Number.parseInt(trimmed.slice(8), 10) || 0;
		} else if (trimmed.startsWith('stale-while-revalidate=')) {
			swr = Number.parseInt(trimmed.slice(23), 10) || 0;
		}
	}
	return { maxAge, swr };
}

/**
 * Parse Cache-Tag header into an array of tags.
 */
function parseCacheTags(header: string | null): string[] {
	if (!header) return [];
	return header
		.split(',')
		.map((t) => t.trim())
		.filter(Boolean);
}

/**
 * Common tracking/analytics query parameters that are excluded from cache
 * keys by default. These do not affect page content but create unnecessary
 * cache fragmentation.
 *
 * Set `query.exclude` to `[]` to include all query parameters.
 */
const DEFAULT_EXCLUDED_PARAMS = [
	'utm_*',
	'fbclid',
	'gclid',
	'gbraid',
	'wbraid',
	'dclid',
	'msclkid',
	'twclid',
	'li_fat_id',
	'mc_cid',
	'mc_eid',
	'_ga',
	'_gl',
	'_hsenc',
	'_hsmi',
	'_ke',
	'oly_anon_id',
	'oly_enc_id',
	'rb_clickid',
	's_cid',
	'vero_id',
	'wickedid',
	'yclid',
	'__s',
	'ref',
];

interface NormalizedQueryConfig {
	sort: boolean;
	include: string[] | null;
	excludeMatcher: picomatch.Matcher | null;
}

function normalizeQueryConfig(query: MemoryCacheQueryOptions | undefined): NormalizedQueryConfig {
	if (query?.include && query?.exclude) {
		throw new AstroError(CacheQueryConfigConflict);
	}

	const sort = query?.sort !== false;
	const include = query?.include ?? null;

	// When `include` is set, exclude is irrelevant — only the allowlisted params matter.
	const excludePatterns = include ? [] : (query?.exclude ?? DEFAULT_EXCLUDED_PARAMS);
	const excludeMatcher =
		excludePatterns.length > 0 ? picomatch(excludePatterns, { nocase: true }) : null;
	return { sort, include, excludeMatcher };
}

/**
 * Build the query string portion of a cache key, applying sorting and filtering.
 */
function buildQueryString(url: URL, config: NormalizedQueryConfig): string {
	const params = new URLSearchParams(url.searchParams);

	// Filter: include mode (allowlist)
	if (config.include) {
		const allowed = new Set(config.include);
		for (const key of [...params.keys()]) {
			if (!allowed.has(key)) {
				params.delete(key);
			}
		}
	}

	// Filter: exclude mode (blocklist with globs)
	if (config.excludeMatcher) {
		for (const key of [...params.keys()]) {
			if (config.excludeMatcher(key)) {
				params.delete(key);
			}
		}
	}

	// Sort
	if (config.sort) {
		params.sort();
	}

	const qs = params.toString();
	return qs ? `?${qs}` : '';
}

function getCacheKey(url: URL, queryConfig: NormalizedQueryConfig): string {
	return `${url.origin}${url.pathname}${buildQueryString(url, queryConfig)}`;
}

function getPathFromCacheKey(key: string, queryConfig: NormalizedQueryConfig): string | null {
	// Strip Vary suffix (everything after the first NUL separator)
	const urlPart = key.split('\0')[0];
	if (!URL.canParse(urlPart)) return null;
	const url = new URL(urlPart);
	return `${url.pathname}${buildQueryString(url, queryConfig)}`;
}

/**
 * Headers that should not be used for Vary-based cache key discrimination.
 * `cookie` is excluded because it has extremely high cardinality (every user
 * has different cookies), making it effectively uncacheable. Use config-level
 * cookie-based vary instead when that is supported.
 * `set-cookie` is a response header and should never appear in Vary.
 */
const IGNORED_VARY_HEADERS = new Set(['cookie', 'set-cookie']);

/**
 * Parse the Vary header into an array of lowercased header names.
 * Returns undefined if no Vary header or Vary: *
 */
function parseVaryHeader(response: Response): string[] | undefined {
	const vary = response.headers.get('Vary');
	if (!vary || vary.trim() === '*') return undefined;
	const headers = vary
		.split(',')
		.map((h) => h.trim().toLowerCase())
		.filter((h) => h && !IGNORED_VARY_HEADERS.has(h));
	return headers.length > 0 ? headers : undefined;
}

/**
 * Extract the values of Vary'd headers from a request.
 */
function getVaryValues(request: Request, varyHeaders: string[]): Record<string, string> {
	const values: Record<string, string> = {};
	for (const header of varyHeaders) {
		values[header] = request.headers.get(header) ?? '';
	}
	return values;
}

/**
 * Check whether a request matches the Vary'd header values stored in a cache entry.
 */
function matchesVary(request: Request, entry: CachedEntry): boolean {
	if (!entry.vary || !entry.varyValues) return true;
	for (const header of entry.vary) {
		const requestValue = request.headers.get(header) ?? '';
		if (requestValue !== entry.varyValues[header]) return false;
	}
	return true;
}

function hasSetCookieHeader(response: Response): boolean {
	return response.headers.has('set-cookie');
}

function warnSkippedSetCookie(url: URL): void {
	console.warn(
		`[astro:cache] Skipping cache for ${url.pathname}${url.search} because response includes Set-Cookie.`,
	);
}

/**
 * Simple LRU cache backed by a Map (insertion-order iteration).
 * When the cache exceeds `max` entries, the oldest entry is evicted.
 */
class LRUMap<K, V> {
	#map = new Map<K, V>();
	#max: number;

	constructor(max: number) {
		this.#max = max;
	}

	get(key: K): V | undefined {
		const value = this.#map.get(key);
		if (value !== undefined) {
			// Move to end (most recently used)
			this.#map.delete(key);
			this.#map.set(key, value);
		}
		return value;
	}

	set(key: K, value: V): void {
		if (this.#map.has(key)) {
			this.#map.delete(key);
		} else if (this.#map.size >= this.#max) {
			// Evict oldest (first inserted)
			const oldest = this.#map.keys().next().value!;
			this.#map.delete(oldest);
		}
		this.#map.set(key, value);
	}

	delete(key: K): boolean {
		return this.#map.delete(key);
	}

	values(): IterableIterator<V> {
		return this.#map.values();
	}

	keys(): IterableIterator<K> {
		return this.#map.keys();
	}

	get size(): number {
		return this.#map.size;
	}
}

/**
 * Serialize a Response into a CachedEntry. Consumes the response body.
 *
 * Callers are responsible for cloning the response first if they still need to
 * return it to the client (see the cache-miss path). In the SWR revalidation
 * path, the stale response has already been sent so no clone is needed.
 */
async function serializeResponse(
	response: Response,
	request: Request,
	maxAge: number,
	swr: number,
	tags: string[],
): Promise<CachedEntry> {
	const body = await response.arrayBuffer();
	const headers: [string, string][] = [];
	response.headers.forEach((value, key) => {
		if (key.toLowerCase() === 'set-cookie') return;
		headers.push([key, value]);
	});
	const vary = parseVaryHeader(response);
	return {
		body,
		status: response.status,
		headers,
		storedAt: Date.now(),
		maxAge,
		swr,
		tags,
		vary,
		varyValues: vary ? getVaryValues(request, vary) : undefined,
	};
}

/**
 * Create a new Response from a CachedEntry.
 */
function createResponseFromCacheEntry(entry: CachedEntry): Response {
	const headers = new Headers(entry.headers);
	return new Response(entry.body.slice(0), {
		status: entry.status,
		headers,
	});
}

function isExpired(entry: CachedEntry): boolean {
	const age = (Date.now() - entry.storedAt) / 1000;
	return age > entry.maxAge;
}

function isStale(entry: CachedEntry): boolean {
	const age = (Date.now() - entry.storedAt) / 1000;
	return age > entry.maxAge && age <= entry.maxAge + entry.swr;
}

/**
 * Build a Vary-aware cache key suffix from a request and a known set of Vary headers.
 * Returns an empty string if there are no Vary headers.
 *
 * Uses NUL (`\0`) as the separator because it cannot appear in URLs or HTTP
 * header values, so there's no risk of collisions with the primary key or
 * between Vary'd values. This keeps the key as a flat string in the LRU map
 * rather than needing a nested lookup structure.
 */
function buildVarySuffix(request: Request, varyHeaders: string[]): string {
	if (varyHeaders.length === 0) return '';
	const parts: string[] = [];
	for (const header of varyHeaders) {
		parts.push(`${header}=${request.headers.get(header) ?? ''}`);
	}
	return `\0${parts.join('\0')}`;
}

const memoryProvider = ((config): CacheProvider => {
	const max = config?.max ?? 1000;
	const queryConfig = normalizeQueryConfig(config?.query);
	const cache = new LRUMap<string, CachedEntry>(max);

	/**
	 * Maps a primary cache key (URL without Vary) to the set of Vary header names
	 * learned from responses. This lets us build the correct Vary-aware key on
	 * subsequent requests before we even look up the entry.
	 */
	const varyMap = new Map<string, string[]>();

	return {
		name: 'memory',

		async onRequest(context, next) {
			const requestUrl = new URL(context.request.url);

			// Only cache GET requests.
			if (context.request.method !== 'GET') {
				return next();
			}

			const primaryKey = getCacheKey(requestUrl, queryConfig);

			// Build the full key including Vary'd header values if we know them
			const knownVary = varyMap.get(primaryKey);
			const varySuffix = knownVary ? buildVarySuffix(context.request, knownVary) : '';
			const key = primaryKey + varySuffix;

			const cached = cache.get(key);

			if (cached) {
				// Double-check Vary match (defensive — the key should already be correct)
				if (matchesVary(context.request, cached)) {
					if (!isExpired(cached)) {
						// Fresh cache hit
						const response = createResponseFromCacheEntry(cached);
						response.headers.set('X-Astro-Cache', 'HIT');
						return response;
					}

					if (isStale(cached)) {
						// SWR: serve stale, trigger background revalidation.
						// The promise is intentionally not awaited — it runs in the
						// background on the long-lived server process and updates the
						// cache entry for subsequent requests.
						next()
							.then(async (freshResponse) => {
								const cdnCC = freshResponse.headers.get('CDN-Cache-Control');
								const { maxAge: newMaxAge, swr: newSwr } = parseCdnCacheControl(cdnCC);
								if (newMaxAge > 0) {
									if (hasSetCookieHeader(freshResponse)) {
										warnSkippedSetCookie(requestUrl);
										return;
									}
									const newTags = parseCacheTags(freshResponse.headers.get('Cache-Tag'));
									const newEntry = await serializeResponse(
										freshResponse,
										context.request,
										newMaxAge,
										newSwr,
										newTags,
									);
									// Update Vary map if the response changed its Vary headers
									if (newEntry.vary) {
										varyMap.set(primaryKey, newEntry.vary);
									}
									cache.set(key, newEntry);
								}
							})
							.catch((error) => {
								console.warn(
									`[astro:cache] Background revalidation failed for ${requestUrl.pathname}${requestUrl.search}: ${String(
										error,
									)}`,
								);
							});

						const response = createResponseFromCacheEntry(cached);
						response.headers.set('X-Astro-Cache', 'STALE');
						return response;
					}
				}

				// Past SWR window or Vary mismatch — expired, treat as miss
			}

			// Cache miss — render fresh
			const response = await next();

			// Parse cache directives from the response headers set by _applyHeaders()
			const cdnCC = response.headers.get('CDN-Cache-Control');
			const { maxAge, swr } = parseCdnCacheControl(cdnCC);

			if (maxAge > 0) {
				if (hasSetCookieHeader(response)) {
					warnSkippedSetCookie(requestUrl);
					return response;
				}
				const tags = parseCacheTags(response.headers.get('Cache-Tag'));
				// Clone the response so we can read the body for caching and still return it
				const [forCache, forClient] = [response.clone(), response];
				const entry = await serializeResponse(forCache, context.request, maxAge, swr, tags);

				// Learn Vary headers from the response and build the storage key
				let storeKey = primaryKey;
				if (entry.vary) {
					varyMap.set(primaryKey, entry.vary);
					storeKey = primaryKey + buildVarySuffix(context.request, entry.vary);
				}

				cache.set(storeKey, entry);
				forClient.headers.set('X-Astro-Cache', 'MISS');
				return forClient;
			}

			// No cache directives — pass through
			return response;
		},

		async invalidate(invalidateOptions: InvalidateOptions) {
			if (invalidateOptions.path) {
				// Path invalidation is exact-match only (no glob/wildcard patterns)
				for (const key of [...cache.keys()]) {
					if (getPathFromCacheKey(key, queryConfig) === invalidateOptions.path) {
						cache.delete(key);
					}
				}
			}
			if (invalidateOptions.tags) {
				const tagsToInvalidate = Array.isArray(invalidateOptions.tags)
					? invalidateOptions.tags
					: [invalidateOptions.tags];
				const tagsSet = new Set(tagsToInvalidate);
				// Iterate and delete entries whose tags overlap
				for (const key of [...cache.keys()]) {
					const entry = cache.get(key);
					if (entry && entry.tags.some((t) => tagsSet.has(t))) {
						cache.delete(key);
					}
				}
			}
		},
	};
}) satisfies CacheProviderFactory<MemoryCacheProviderOptions>;

export default memoryProvider;
