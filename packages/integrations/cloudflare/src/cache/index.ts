import type { CacheProviderConfig } from 'astro';

/**
 * Configure the Cloudflare Workers cache provider for Astro route caching.
 *
 * Uses `Cloudflare-CDN-Cache-Control` and `Cache-Tag` headers for
 * Cloudflare's built-in Worker caching layer, with tag and path prefix
 * purging via the Worker cache API.
 */
export function cacheCloudflare(): CacheProviderConfig {
	return {
		name: 'cloudflare',
		entrypoint: '@astrojs/cloudflare/cache/provider',
	};
}
