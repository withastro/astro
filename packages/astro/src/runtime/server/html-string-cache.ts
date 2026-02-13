import { HTMLString } from './escape.js';

/**
 * LRU (Least Recently Used) cache for HTMLString objects.
 *
 * This cache reduces memory allocations by reusing identical HTMLString objects
 * across both recursive rendering (.astro files) and queue rendering (MDX files).
 *
 * When the cache reaches maxSize, the least recently used item is evicted.
 * This keeps memory usage bounded while maintaining good cache hit rates.
 *
 * Example:
 * - 10,000 identical `<li class="foo">` tags → single cached HTMLString object
 * - Memory savings: ~30KB (10,000 objects) → ~3 bytes (1 object + Map overhead)
 */
export class HTMLStringCache {
	private cache = new Map<string, HTMLString>();
	private readonly maxSize: number;

	constructor(maxSize = 1000) {
		this.maxSize = maxSize;
	}

	/**
	 * Get or create an HTMLString for the given content.
	 * If cached, the existing object is returned and moved to end (most recently used).
	 * If not cached, a new HTMLString is created, cached, and returned.
	 *
	 * @param content - The HTML string content
	 * @returns HTMLString object (cached or newly created)
	 */
	getOrCreate(content: string): HTMLString {
		// Check cache
		const cached = this.cache.get(content);
		if (cached) {
			// LRU: move to end (most recently used)
			// Maps maintain insertion order, so delete + set moves to end
			this.cache.delete(content);
			this.cache.set(content, cached);
			return cached;
		}

		// Create new HTMLString
		const htmlString = new HTMLString(content);

		// Add to cache
		this.cache.set(content, htmlString);

		// Evict least recently used if over size
		// The first key in the Map is the oldest (least recently used)
		if (this.cache.size > this.maxSize) {
			const firstKey = this.cache.keys().next().value;
			if (firstKey !== undefined) {
				this.cache.delete(firstKey);
			}
		}

		return htmlString;
	}

	/**
	 * Get current cache size
	 */
	size(): number {
		return this.cache.size;
	}

	/**
	 * Clear the entire cache
	 */
	clear(): void {
		this.cache.clear();
	}
}

/**
 * Global HTMLString cache shared across all renders.
 *
 * Using a global cache (rather than per-request) provides:
 * - Better cache hit rates across multiple page renders
 * - Memory savings accumulate over the lifetime of the process
 * - Particularly beneficial during build (thousands of pages)
 *
 * The LRU eviction (maxSize: 1000) keeps memory bounded even for large sites.
 */
export const globalHTMLStringCache = new HTMLStringCache(1000);

/**
 * Flag to enable/disable HTMLString caching globally.
 * Can be controlled via SSRResult config.
 */
let htmlStringCacheEnabled = true;

/**
 * Enable or disable HTMLString caching globally.
 * This is controlled by the experimentalQueuedRendering.cache option.
 */
export function setHTMLStringCacheEnabled(enabled: boolean): void {
	htmlStringCacheEnabled = enabled;
}

/**
 * Check if HTMLString caching is enabled.
 */
export function isHTMLStringCacheEnabled(): boolean {
	return htmlStringCacheEnabled;
}
