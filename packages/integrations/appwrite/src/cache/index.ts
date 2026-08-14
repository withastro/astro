import type { CacheProviderConfig } from 'astro';

/**
 * Options for {@link cacheAppwrite}.
 *
 * Every value is optional: on Appwrite Sites the endpoint, project and API key
 * come from the runtime, and the domain to purge comes from the request being
 * served. The options cover the cases where that is not enough — a site
 * reachable on several domains, an invalidation triggered outside of a request,
 * or a self-hosted Appwrite instance.
 *
 * The object is serialized into the build manifest, so it must stay JSON-safe.
 */
export interface AppwriteCacheConfig {
	/**
	 * Domain(s) whose CDN cache is purged by `cache.invalidate()`.
	 *
	 * Defaults to the domain of the request being served. Set this when the site
	 * answers on more than one domain (for example both its `*.appwrite.network`
	 * subdomain and a custom domain), because a purge only clears the domain it
	 * names.
	 */
	domain?: string | string[];
	/**
	 * Appwrite API endpoint, e.g. `https://<REGION>.cloud.appwrite.io/v1`.
	 *
	 * Defaults to `APPWRITE_FUNCTION_API_ENDPOINT`, then
	 * `APPWRITE_SITE_API_ENDPOINT`, then Appwrite Cloud.
	 */
	endpoint?: string;
	/**
	 * Appwrite project ID.
	 *
	 * Defaults to `APPWRITE_FUNCTION_PROJECT_ID`, then
	 * `APPWRITE_SITE_PROJECT_ID`.
	 */
	projectId?: string;
	/**
	 * API key used to create invalidations. It needs the
	 * `proxy.invalidations.write` scope.
	 *
	 * Defaults to the dynamic key Appwrite sends on the `x-appwrite-key` request
	 * header, then `APPWRITE_API_KEY`. Prefer those over hardcoding a key here:
	 * this value is baked into the build output.
	 */
	apiKey?: string;
	/**
	 * Send `Appwrite-CDN-Cache-Control: no-store` for responses that declare no
	 * cache intent, so that opting in to route caching never lets the CDN's
	 * default TTL cache a route that never asked to be cached. Defaults to
	 * `true`.
	 *
	 * Responses that set their own `Cache-Control` are left alone either way.
	 */
	noStore?: boolean;
}

/**
 * Configure the Appwrite CDN cache provider for Astro route caching.
 *
 * Uses `Appwrite-CDN-Cache-Control` and `Appwrite-CDN-Cache-Key` headers for the
 * CDN in front of the site's domain, and `createInvalidation()` from
 * `node-appwrite` for cache key and path invalidation.
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
