import type { CacheProviderConfig } from 'astro';

/**
 * Configure the Netlify CDN cache provider for Astro route caching.
 *
 * Uses `Netlify-CDN-Cache-Control` and `Netlify-Cache-Tag` headers
 * for Netlify's durable cache, and `purgeCache()` from `@netlify/functions`
 * for tag-based invalidation.
 */
export function cacheNetlify(): CacheProviderConfig {
	return {
		name: 'netlify',
		entrypoint: '@astrojs/netlify/cache/provider',
	};
}
