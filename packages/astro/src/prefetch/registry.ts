/*
  NOTE: This module is shared between the prefetch script (`astro:prefetch`) and the view
  transitions router (`astro:transitions/client`). Keep it small and dependency-free so that
  importing it from the router does not pull the prefetch script into bundles that don't use it.
*/

// The number of milliseconds after a URL is prefetched during which the router may reuse
// the response the prefetch downloaded without revalidating it. This matches the window
// Chromium applies to its own prefetched responses (`kPrefetchReuseMins` in `net/http/http_cache.h`).
const PREFETCH_REUSE_WINDOW = 5 * 60 * 1000;

// Track prefetched URLs and when they were prefetched, so we don't prefetch twice and so
// navigations that happen shortly after a prefetch can reuse the prefetched response.
const prefetchedUrls = new Map<string, number>();

/**
 * Normalize a full or partial URL string so that the prefetch script and the view transitions
 * router agree on the key used to track it, no matter in which form the URL was handed to them.
 */
export function normalizePrefetchUrl(url: string): string {
	const urlObj = new URL(url, location.href);
	// Ignore the hash as it points into the same document
	urlObj.hash = '';
	return urlObj.href;
}

/**
 * Record that a URL has just been prefetched.
 */
export function recordPrefetch(url: string) {
	prefetchedUrls.set(normalizePrefetchUrl(url), Date.now());
}

/**
 * Whether a URL has been prefetched before, no matter how long ago.
 */
export function hasBeenPrefetched(url: string): boolean {
	return prefetchedUrls.has(normalizePrefetchUrl(url));
}

/**
 * Whether a URL was prefetched recently enough that the response the prefetch downloaded
 * can be reused without revalidation, mirroring how browsers treat their own prefetches.
 */
export function wasPrefetchedRecently(url: string): boolean {
	const prefetchedAt = prefetchedUrls.get(normalizePrefetchUrl(url));
	return prefetchedAt !== undefined && Date.now() - prefetchedAt < PREFETCH_REUSE_WINDOW;
}
