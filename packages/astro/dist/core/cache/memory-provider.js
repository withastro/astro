import picomatch from 'picomatch';
import { AstroError } from '../errors/errors.js';
import { CacheQueryConfigConflict } from '../errors/errors-data.js';
function parseCdnCacheControl(header) {
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
function parseCacheTags(header) {
	if (!header) return [];
	return header
		.split(',')
		.map((t) => t.trim())
		.filter(Boolean);
}
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
function normalizeQueryConfig(query) {
	if (query?.include && query?.exclude) {
		throw new AstroError(CacheQueryConfigConflict);
	}
	const sort = query?.sort !== false;
	const include = query?.include ?? null;
	const excludePatterns = include ? [] : (query?.exclude ?? DEFAULT_EXCLUDED_PARAMS);
	const excludeMatcher =
		excludePatterns.length > 0 ? picomatch(excludePatterns, { nocase: true }) : null;
	return { sort, include, excludeMatcher };
}
function buildQueryString(url, config) {
	const params = new URLSearchParams(url.searchParams);
	if (config.include) {
		const allowed = new Set(config.include);
		for (const key of [...params.keys()]) {
			if (!allowed.has(key)) {
				params.delete(key);
			}
		}
	}
	if (config.excludeMatcher) {
		for (const key of [...params.keys()]) {
			if (config.excludeMatcher(key)) {
				params.delete(key);
			}
		}
	}
	if (config.sort) {
		params.sort();
	}
	const qs = params.toString();
	return qs ? `?${qs}` : '';
}
function getCacheKey(url, queryConfig) {
	return `${url.origin}${url.pathname}${buildQueryString(url, queryConfig)}`;
}
function getPathFromCacheKey(key, queryConfig) {
	const urlPart = key.split('\0')[0];
	if (!URL.canParse(urlPart)) return null;
	const url = new URL(urlPart);
	return `${url.pathname}${buildQueryString(url, queryConfig)}`;
}
const IGNORED_VARY_HEADERS = /* @__PURE__ */ new Set(['cookie', 'set-cookie']);
function parseVaryHeader(response) {
	const vary = response.headers.get('Vary');
	if (!vary || vary.trim() === '*') return void 0;
	const headers = vary
		.split(',')
		.map((h) => h.trim().toLowerCase())
		.filter((h) => h && !IGNORED_VARY_HEADERS.has(h));
	return headers.length > 0 ? headers : void 0;
}
function getVaryValues(request, varyHeaders) {
	const values = /* @__PURE__ */ Object.create(null);
	for (const header of varyHeaders) {
		values[header] = request.headers.get(header) ?? '';
	}
	return values;
}
function matchesVary(request, entry) {
	if (!entry.vary || !entry.varyValues) return true;
	for (const header of entry.vary) {
		const requestValue = request.headers.get(header) ?? '';
		if (requestValue !== entry.varyValues[header]) return false;
	}
	return true;
}
function hasSetCookieHeader(response) {
	return response.headers.has('set-cookie');
}
function warnSkippedSetCookie(url) {
	console.warn(
		`[astro:cache] Skipping cache for ${url.pathname}${url.search} because response includes Set-Cookie.`,
	);
}
class LRUMap {
	#map = /* @__PURE__ */ new Map();
	#max;
	constructor(max) {
		this.#max = max;
	}
	get(key) {
		const value = this.#map.get(key);
		if (value !== void 0) {
			this.#map.delete(key);
			this.#map.set(key, value);
		}
		return value;
	}
	set(key, value) {
		if (this.#map.has(key)) {
			this.#map.delete(key);
		} else if (this.#map.size >= this.#max) {
			const oldest = this.#map.keys().next().value;
			this.#map.delete(oldest);
		}
		this.#map.set(key, value);
	}
	delete(key) {
		return this.#map.delete(key);
	}
	values() {
		return this.#map.values();
	}
	keys() {
		return this.#map.keys();
	}
	get size() {
		return this.#map.size;
	}
}
async function serializeResponse(response, request, maxAge, swr, tags) {
	const body = await response.arrayBuffer();
	const headers = [];
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
		varyValues: vary ? getVaryValues(request, vary) : void 0,
	};
}
function createResponseFromCacheEntry(entry) {
	const headers = new Headers(entry.headers);
	return new Response(entry.body.slice(0), {
		status: entry.status,
		headers,
	});
}
function isExpired(entry) {
	const age = (Date.now() - entry.storedAt) / 1e3;
	return age > entry.maxAge;
}
function isStale(entry) {
	const age = (Date.now() - entry.storedAt) / 1e3;
	return age > entry.maxAge && age <= entry.maxAge + entry.swr;
}
function buildVarySuffix(request, varyHeaders) {
	if (varyHeaders.length === 0) return '';
	const parts = [];
	for (const header of varyHeaders) {
		parts.push(`${header}=${request.headers.get(header) ?? ''}`);
	}
	return `\0${parts.join('\0')}`;
}
const memoryProvider = (config) => {
	const max = config?.max ?? 1e3;
	const queryConfig = normalizeQueryConfig(config?.query);
	const cache = new LRUMap(max);
	const varyMap = /* @__PURE__ */ new Map();
	return {
		name: 'memory',
		async onRequest(context, next) {
			const requestUrl = new URL(context.request.url);
			if (context.request.method !== 'GET') {
				return next();
			}
			const primaryKey = getCacheKey(requestUrl, queryConfig);
			const knownVary = varyMap.get(primaryKey);
			const varySuffix = knownVary ? buildVarySuffix(context.request, knownVary) : '';
			const key = primaryKey + varySuffix;
			const cached = cache.get(key);
			if (cached) {
				if (matchesVary(context.request, cached)) {
					if (!isExpired(cached)) {
						const response2 = createResponseFromCacheEntry(cached);
						response2.headers.set('X-Astro-Cache', 'HIT');
						return response2;
					}
					if (isStale(cached)) {
						next()
							.then(async (freshResponse) => {
								const cdnCC2 = freshResponse.headers.get('CDN-Cache-Control');
								const { maxAge: newMaxAge, swr: newSwr } = parseCdnCacheControl(cdnCC2);
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
						const response2 = createResponseFromCacheEntry(cached);
						response2.headers.set('X-Astro-Cache', 'STALE');
						return response2;
					}
				}
			}
			const response = await next();
			const cdnCC = response.headers.get('CDN-Cache-Control');
			const { maxAge, swr } = parseCdnCacheControl(cdnCC);
			if (maxAge > 0) {
				if (hasSetCookieHeader(response)) {
					warnSkippedSetCookie(requestUrl);
					return response;
				}
				const tags = parseCacheTags(response.headers.get('Cache-Tag'));
				const [forCache, forClient] = [response.clone(), response];
				const entry = await serializeResponse(forCache, context.request, maxAge, swr, tags);
				let storeKey = primaryKey;
				if (entry.vary) {
					varyMap.set(primaryKey, entry.vary);
					storeKey = primaryKey + buildVarySuffix(context.request, entry.vary);
				}
				cache.set(storeKey, entry);
				forClient.headers.set('X-Astro-Cache', 'MISS');
				return forClient;
			}
			return response;
		},
		async invalidate(invalidateOptions) {
			if (invalidateOptions.path) {
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
				for (const key of [...cache.keys()]) {
					const entry = cache.get(key);
					if (entry && entry.tags.some((t) => tagsSet.has(t))) {
						cache.delete(key);
					}
				}
			}
		},
	};
};
var memory_provider_default = memoryProvider;
export { memory_provider_default as default };
