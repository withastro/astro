import { markFeatureUsed, FetchFeatures } from '../fetch/features.js';
import type { FetchState } from '../fetch/fetch-state.js';
import type { SSRManifest } from '../app/types.js';
import { getEnvironment } from '../environment/index.js';
import { createManifestMemo } from '../manifest/memo.js';
import { getCacheProvider } from './provider.js';
import { AstroCache, applyCacheHeaders, type CacheLike } from './runtime/cache.js';
import { NoopAstroCache, DisabledAstroCache } from './runtime/noop.js';
import {
	compileCacheRoutes,
	matchCacheRoute,
	type CompiledCacheRoute,
} from './runtime/route-matching.js';

const CACHE_KEY = 'cache';

/**
 * Registers a cache provider on the given `FetchState`. When
 * `state.resolve('cache')` is first called, the appropriate cache
 * implementation is created (disabled, noop for dev, or real).
 *
 * Returns synchronously when cache is not configured or in dev mode.
 */
export function provideCache(state: FetchState): Promise<void> | void {
	const manifest = state.manifest;

	if (!manifest.cacheConfig) {
		// Cache not configured — provide a disabled cache that warns once
		state.provide<CacheLike>(CACHE_KEY, {
			create: () => new DisabledAstroCache(state.logger),
		});
		return;
	}

	if (getEnvironment(manifest).runtimeMode === 'development') {
		state.provide<CacheLike>(CACHE_KEY, {
			create: () => new NoopAstroCache(),
		});
		return;
	}

	return provideCacheAsync(state, manifest);
}

async function provideCacheAsync(state: FetchState, manifest: SSRManifest): Promise<void> {
	const cacheProvider = await getCacheProvider(manifest);

	state.provide<CacheLike>(CACHE_KEY, {
		create() {
			const cache = new AstroCache(cacheProvider);

			// Apply config-level cache route matching as initial state. The
			// compiled routes are derived lazily by the manifest memo, so the
			// compile still happens on the first cache-seeded request.
			if (manifest.cacheConfig?.routes) {
				const matched = matchCacheRoute(state.pathname, getCompiledCacheRoutes(manifest));
				if (matched) {
					cache.set(matched);
				}
			}

			return cache;
		},
	});
}

/**
 * Wraps a render callback with cache provider logic. Handles both
 * runtime caching (onRequest) and CDN-based providers (headers only).
 *
 * - When a cache provider with `onRequest` is configured, the callback
 *   is wrapped so the provider can serve from cache or fall through.
 * - When only CDN headers are needed, the callback runs directly and
 *   cache headers are applied to the response.
 * - When no cache provider is configured, the callback runs as-is.
 *
 * Cache headers (`CDN-Cache-Control`, `Cache-Tag`) are stripped from
 * the final response after the runtime provider has read them.
 */
export async function handleCache(
	state: FetchState,
	next: () => Promise<Response>,
): Promise<Response> {
	markFeatureUsed(state.manifest, FetchFeatures.cache);
	if (!state.manifest.cacheProvider) {
		return next();
	}

	const cache = state.resolve<CacheLike>(CACHE_KEY);
	const cacheProvider = await getCacheProvider(state.manifest);

	if (cacheProvider?.onRequest) {
		const response = await cacheProvider.onRequest(
			{
				request: state.request,
				url: new URL(state.request.url),
				waitUntil: state.renderOptions.waitUntil,
				logger: {
					info(msg) {
						state.logger.info('cache', msg);
					},
					warn(msg) {
						state.logger.warn('cache', msg);
					},
					error(msg) {
						state.logger.error('cache', msg);
					},
				},
			},
			async () => {
				const res = await next();
				applyCacheHeaders(cache!, res, state.request);
				return res;
			},
		);
		// Strip CDN headers after the runtime provider has read them
		response.headers.delete('CDN-Cache-Control');
		response.headers.delete('Cache-Tag');
		return response;
	}

	const response = await next();
	// Apply cache headers for CDN-based providers (no onRequest)
	applyCacheHeaders(cache!, response, state.request);
	return response;
}

const compiledCacheRoutesMemo = createManifestMemo((manifest: SSRManifest) =>
	manifest.cacheConfig?.routes
		? compileCacheRoutes(manifest.cacheConfig.routes, manifest.base, manifest.trailingSlash)
		: [],
);

/**
 * Config-level cache routes compiled from `manifest.cacheConfig`, derived
 * lazily on the first cache-seeded request.
 */
export function getCompiledCacheRoutes(manifest: SSRManifest): CompiledCacheRoute[] {
	return compiledCacheRoutesMemo.get(manifest);
}

/**
 * Internal raw setter — exists only so the transitional `Pipeline` bridge can
 * expose `compiledCacheRoutes` as a get/set pair.
 */
export function setCompiledCacheRoutes(manifest: SSRManifest, routes: CompiledCacheRoute[]): void {
	compiledCacheRoutesMemo.set(manifest, routes);
}
