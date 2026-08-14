import type { CacheProviderConfig } from 'astro';

/**
 * Options for {@link cacheAppwrite}.
 *
 * Every value is optional becasue Appwrite Sites runtime provides
 * endpoint, project ID and API key automatically.
 * Domain to purge comes from the request itself.
 */
export interface AppwriteCacheConfig {
	/**
	 * Domain(s) whose CDN cache is purged by `cache.invalidate()`, e.g. `my-app.appwrite.network`.
	 */
	domain?: string | string[];

	/**
	 * Appwrite API endpoint, e.g. `https://<REGION>.cloud.appwrite.io/v1`.
	 */
	endpoint?: string;

	/**
	 * Appwrite project ID, e.g. `6a78727a0196a3606522`
	 */
	projectId?: string;

	/**
	 * API key used to create invalidations.
	 * Key requires `proxy.invalidations.write` scope.
	 */
	apiKey?: string;

	/**
	 * Prevent Appwrite CDN from caching the response
	 * Defaults to `true`.
	 */
	noStore?: boolean;
}

/**
 * Configure the Appwrite CDN cache provider for Astro route caching.
 *
 * Appwrite Sites runs Astro through `@astrojs/node`, so this provider is
 * configured next to that adapter:
 *
 * ```js
 * // astro.config.mjs
 * import { defineConfig } from 'astro/config';
 * import node from '@astrojs/node';
 * import { cacheAppwrite } from '@astrojs/appwrite/cache';
 *
 * export default defineConfig({
 *   adapter: node({ mode: 'standalone' }),
 *   cache: { provider: cacheAppwrite() },
 * });
 * ```
 */
export function cacheAppwrite(
	config: AppwriteCacheConfig = {},
): CacheProviderConfig<AppwriteCacheConfig> {
	return {
		name: 'appwrite',
		entrypoint: '@astrojs/appwrite/cache/provider',
		config,
	};
}
