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
export declare class HTMLStringCache {
	private cache;
	private readonly maxSize;
	constructor(maxSize?: number);
	/**
	 * Get or create an HTMLString for the given content.
	 * If cached, the existing object is returned and moved to end (most recently used).
	 * If not cached, a new HTMLString is created, cached, and returned.
	 *
	 * @param content - The HTML string content
	 * @returns HTMLString object (cached or newly created)
	 */
	getOrCreate(content: string): HTMLString;
	/**
	 * Get current cache size
	 */
	size(): number;
	/**
	 * Pre-warms the cache with common HTML patterns.
	 * This ensures first-render cache hits for frequently used tags.
	 *
	 * @param patterns - Array of HTML strings to pre-cache
	 */
	warm(patterns: string[]): void;
	/**
	 * Clear the entire cache
	 */
	clear(): void;
}
/**
 * Common HTML patterns that appear frequently in Astro pages.
 * Pre-warming the cache with these patterns ensures first-render cache hits.
 */
export declare const COMMON_HTML_PATTERNS: string[];
