import { AsyncLocalStorage } from 'node:async_hooks';
import type { CacheProviderFactory } from 'astro';
import { buildCacheControlDirectives, setConditionalHeaders } from 'astro/cache/provider-utils';
import type { AppwriteCacheConfig } from './index.js';
import {
	planInvalidations,
	type RequestScope,
	resolveCredentials,
	resolveDomains,
	toCacheKeys,
} from './utils.js';

/**
 * Cache directives for the Appwrite CDN. The edge rewrites this into the header
 * the CDN in front of the domain honors and strips it from the response, so it
 * never reaches the browser.
 */
const CACHE_CONTROL_HEADER = 'Appwrite-CDN-Cache-Control';

/** Whitespace-separated cache keys, Appwrite's unit of invalidation. */
const CACHE_KEY_HEADER = 'Appwrite-CDN-Cache-Key';

/** Deployment-scoped dynamic API key Appwrite sends with every request. */
const API_KEY_HEADER = 'x-appwrite-key';

/**
 * Headers that already express a cache intent for the response, and that the
 * `no-store` default therefore leaves alone.
 *
 * `CDN-Cache-Control` is deliberately not one of them: Astro strips it from the
 * response once a provider with `onRequest` has run, so a route setting it by
 * hand would otherwise end up announcing nothing at all.
 */
const CACHE_CONTROL_HEADERS = [CACHE_CONTROL_HEADER, 'Cache-Control'];

/**
 * `invalidate()` receives only what the caller passed to `cache.invalidate()`,
 * but the invalidation API also needs a domain and an API key. Both belong to the
 * request being served, so `onRequest` stashes them here for the invalidations
 * that happen while rendering it. Appwrite Sites runs on Node, so
 * `AsyncLocalStorage` is available.
 */
const requestScope = new AsyncLocalStorage<RequestScope>();

const factory: CacheProviderFactory<AppwriteCacheConfig> = (config = {}) => {
	const noStore = config.noStore ?? true;

	return {
		name: 'appwrite',

		setHeaders(options) {
			const headers = new Headers();

			// Appwrite-CDN-Cache-Control (Appwrite-specific, highest priority)
			const directives = buildCacheControlDirectives(options, ['public']);
			if (directives) {
				headers.set(CACHE_CONTROL_HEADER, directives);
			}

			// Unlike Netlify and Vercel, Appwrite purges a path natively, so there is
			// no auto-generated path tag to spend a cache key on.
			const keys = toCacheKeys(options.tags);
			if (keys.length > 0) {
				headers.set(CACHE_KEY_HEADER, keys.join(' '));
			}

			setConditionalHeaders(headers, options);

			return headers;
		},

		onRequest(context, next) {
			return requestScope.run(
				{
					apiKey: context.request.headers.get(API_KEY_HEADER) ?? undefined,
					// The rule to purge is registered on a bare domain, so the port (a
					// local `astro preview`, say) is not part of it.
					domain: context.url.hostname,
				},
				async () => {
					const response = await next();

					// A route that declared no cache intent gets `no-store`, so that
					// configuring this provider cannot hand the CDN's default TTL a
					// response nobody asked to have cached.
					if (noStore && !CACHE_CONTROL_HEADERS.some((header) => response.headers.has(header))) {
						try {
							response.headers.set(CACHE_CONTROL_HEADER, 'no-store');
						} catch {
							// Some responses (one replayed from another cache layer, say)
							// have immutable headers. The response is served as-is rather
							// than rebuilt: no cache intent was declared for it either way.
						}
					}

					return response;
				},
			);
		},

		async invalidate(options) {
			const scope = requestScope.getStore();
			const invalidations = planInvalidations(options, resolveDomains(config, scope));

			if (invalidations.length === 0) {
				return;
			}

			const { endpoint, projectId, apiKey } = resolveCredentials(config, scope);

			// Imported lazily so the SDK stays out of the render path of every request
			// that does not invalidate anything.
			const { Client, InvalidationType, Proxy } = await import('node-appwrite');

			const proxy = new Proxy(
				new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey),
			);

			await Promise.all(
				invalidations.map(({ domain, type, reference }) =>
					proxy.createInvalidation({
						domain,
						type: type === 'path' ? InvalidationType.Path : InvalidationType.Tag,
						reference,
					}),
				),
			);
		},
	};
};

export default factory;
