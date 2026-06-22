import type { CacheProviderConfig } from 'astro';

/**
 * Configure the Cloudflare Workers cache provider for Astro route caching.
 *
 * Uses `Cloudflare-CDN-Cache-Control` and `Cache-Tag` headers for
 * Cloudflare's built-in Worker caching layer. Responses are auto-tagged
 * with the request path so that both tag-based and path-based invalidation
 * are implemented via tag purging through the Worker cache API.
 */
export function cacheCloudflare(): CacheProviderConfig {
	return {
		name: 'cloudflare',
		entrypoint: '@astrojs/cloudflare/cache/provider',
	};
}
