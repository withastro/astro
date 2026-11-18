import type { CacheProviderConfig } from 'astro';

/**
 * Configure the Vercel CDN cache provider for Astro route caching.
 *
 * Uses `Vercel-CDN-Cache-Control` and `Vercel-Cache-Tag` headers
 * for Vercel's edge cache, and `invalidateByTag()` from `@vercel/functions`
 * for tag-based invalidation.
 */
export function cacheVercel(): CacheProviderConfig {
	return {
		name: 'vercel',
		entrypoint: '@astrojs/vercel/cache/provider',
	};
}
