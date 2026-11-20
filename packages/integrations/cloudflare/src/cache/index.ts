import type { CacheProviderConfig } from 'astro';

export interface CloudflareCacheOptions {
	/**
	 * What Astro's `cache.invalidate()` does with matching cached responses.
	 *
	 * - `'purge'` deletes them with Workers Cache `purge()`. The next request renders the route.
	 * - `'revalidate'` marks them stale with Workers Cache `invalidate()`. For a cached response sent
	 *   with `swr`, Cloudflare can serve it stale while the Worker revalidates it in the background.
	 *
	 * Only use `'revalidate'` if every route's `ETag` changes whenever its content changes: a
	 * revalidation with the same `ETag` can leave the old body cached. With the `CF_VERSION_METADATA`
	 * binding, a route that sets `lastModified` but no `etag` gets an `ETag` derived from it.
	 *
	 * @default 'purge'
	 */
	invalidation?: 'purge' | 'revalidate';
}

/**
 * Configure the Cloudflare Workers cache provider for Astro route caching.
 *
 * Uses `Cloudflare-CDN-Cache-Control` and `Cache-Tag` headers for
 * Cloudflare's built-in Worker caching layer. Responses are auto-tagged
 * with the request path so that both tag-based and path-based invalidation
 * go through cache tags in the Worker cache API. With the
 * `CF_VERSION_METADATA` binding configured, they also carry the Worker
 * version as an `astro-version:` tag.
 */
export function cacheCloudflare(
	options: CloudflareCacheOptions = {},
): CacheProviderConfig<CloudflareCacheOptions> {
	const { invalidation } = options;
	if (invalidation !== undefined && invalidation !== 'purge' && invalidation !== 'revalidate') {
		throw new Error(
			`Invalid \`invalidation\` option for cacheCloudflare(): ${JSON.stringify(invalidation)}. Use 'purge' or 'revalidate'.`,
		);
	}
	return {
		name: 'cloudflare',
		entrypoint: '@astrojs/cloudflare/cache/provider',
		config: options,
	};
}
