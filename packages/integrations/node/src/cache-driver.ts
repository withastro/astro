import type { CacheProvider, CacheProviderFactory, InvalidateOptions } from 'astro';

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
}

interface NodeCacheProviderOptions {
	/** Maximum number of entries to keep in cache. Defaults to 1000. */
	max?: number;
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
 */
async function serializeResponse(
	response: Response,
	maxAge: number,
	swr: number,
	tags: string[],
): Promise<CachedEntry> {
	const body = await response.arrayBuffer();
	const headers: [string, string][] = [];
	response.headers.forEach((value, key) => {
		headers.push([key, value]);
	});
	return {
		body,
		status: response.status,
		headers,
		storedAt: Date.now(),
		maxAge,
		swr,
		tags,
	};
}

/**
 * Reconstruct a Response from a CachedEntry.
 */
function deserializeResponse(entry: CachedEntry): Response {
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

const nodeMemoryProvider: CacheProviderFactory = (
	config: Record<string, any> | undefined,
): CacheProvider => {
	const options: NodeCacheProviderOptions = (config as NodeCacheProviderOptions) ?? {};
	const max = options.max ?? 1000;
	const cache = new LRUMap<string, CachedEntry>(max);

	return {
		name: 'node-memory',

		async onRequest(context, next) {
			const key = new URL(context.request.url).pathname + new URL(context.request.url).search;

			// Only cache GET/HEAD requests
			if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
				return next();
			}

			const cached = cache.get(key);

			if (cached) {
				if (!isExpired(cached)) {
					// Fresh cache hit
					const response = deserializeResponse(cached);
					response.headers.set('X-Astro-Cache', 'HIT');
					return response;
				}

				if (isStale(cached)) {
					// SWR: serve stale, trigger background revalidation
					const revalidate = next().then(async (freshResponse) => {
						const cdnCC = freshResponse.headers.get('CDN-Cache-Control');
						const { maxAge: newMaxAge, swr: newSwr } = parseCdnCacheControl(cdnCC);
						if (newMaxAge > 0) {
							const newTags = parseCacheTags(freshResponse.headers.get('Cache-Tag'));
							const newEntry = await serializeResponse(freshResponse, newMaxAge, newSwr, newTags);
							cache.set(key, newEntry);
						}
					});

					// Use waitUntil if available (prevents the promise from being GC'd)
					if (context.waitUntil) {
						context.waitUntil(revalidate);
					}

					const response = deserializeResponse(cached);
					response.headers.set('X-Astro-Cache', 'STALE');
					return response;
				}

				// Past SWR window — expired, treat as miss
			}

			// Cache miss — render fresh
			const response = await next();

			// Parse cache directives from the response headers set by _applyHeaders()
			const cdnCC = response.headers.get('CDN-Cache-Control');
			const { maxAge, swr } = parseCdnCacheControl(cdnCC);

			if (maxAge > 0) {
				const tags = parseCacheTags(response.headers.get('Cache-Tag'));
				// Clone the response so we can read the body for caching and still return it
				const [forCache, forClient] = [response.clone(), response];
				const entry = await serializeResponse(forCache, maxAge, swr, tags);
				cache.set(key, entry);
				forClient.headers.set('X-Astro-Cache', 'MISS');
				return forClient;
			}

			// No cache directives — pass through
			return response;
		},

		async invalidate(invalidateOptions: InvalidateOptions) {
			if (invalidateOptions.path) {
				cache.delete(invalidateOptions.path);
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
};

export default nodeMemoryProvider;
