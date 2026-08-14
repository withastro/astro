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

const CACHE_CONTROL_HEADER = 'Appwrite-CDN-Cache-Control';
const CACHE_KEY_HEADER = 'Appwrite-CDN-Cache-Key'; // Whitespace-separated
const API_KEY_HEADER = 'x-appwrite-key'; // Auto-provided by Appwrite Sites runtime
const CACHE_CONTROL_HEADERS = [CACHE_CONTROL_HEADER, 'Cache-Control']; // Includes browser cache for no-cache support

const requestScope = new AsyncLocalStorage<RequestScope>();

const factory: CacheProviderFactory<AppwriteCacheConfig> = (config = {}) => {
	const noStore = config.noStore ?? true;

	return {
		name: 'appwrite',

		setHeaders(options) {
			const headers = new Headers();

			const directives = buildCacheControlDirectives(options, ['public']);
			if (directives) {
				headers.set(CACHE_CONTROL_HEADER, directives);
			}

			// Unlike Netlify and Vercel, Appwrite purges a path natively
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
					domain: context.url.hostname,
				},
				async () => {
					const response = await next();

					if (noStore && !CACHE_CONTROL_HEADERS.some((header) => response.headers.has(header))) {
						try {
							response.headers.set(CACHE_CONTROL_HEADER, 'no-store');
						} catch {
							// Ignore relayed response immutable headers exception
							// Original response already has correct header
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

			// Imported lazily so the SDK load doesnt occur on every request
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
