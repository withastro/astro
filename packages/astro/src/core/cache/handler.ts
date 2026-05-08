import type { BaseApp } from '../app/base.js';
import { PipelineFeatures } from '../base-pipeline.js';
import type { FetchState } from '../fetch/fetch-state.js';
import type { Pipeline } from '../base-pipeline.js';
import { AstroCache, applyCacheHeaders, type CacheLike } from './runtime/cache.js';
import { NoopAstroCache, DisabledAstroCache } from './runtime/noop.js';
import { compileCacheRoutes, matchCacheRoute } from './runtime/route-matching.js';

const CACHE_KEY = 'cache';

/**
 * Registers a cache provider on the given `FetchState`. When
 * `state.resolve('cache')` is first called, the appropriate cache
 * implementation is created (disabled, noop for dev, or real).
 *
 * Returns synchronously when cache is not configured or in dev mode.
 */
export function provideCache(state: FetchState): Promise<void> | void {
	const pipeline = state.pipeline;

	if (!pipeline.cacheConfig) {
		// Cache not configured — provide a disabled cache that warns once
		state.provide<CacheLike>(CACHE_KEY, {
			create: () => new DisabledAstroCache(pipeline.logger),
		});
		return;
	}

	if (pipeline.runtimeMode === 'development') {
		state.provide<CacheLike>(CACHE_KEY, {
			create: () => new NoopAstroCache(),
		});
		return;
	}

	return provideCacheAsync(state, pipeline);
}

async function provideCacheAsync(state: FetchState, pipeline: Pipeline): Promise<void> {
	const cacheProvider = await pipeline.getCacheProvider();

	state.provide<CacheLike>(CACHE_KEY, {
		create() {
			const cache = new AstroCache(cacheProvider);

			// Apply config-level cache route matching as initial state
			if (pipeline.cacheConfig?.routes) {
				if (!pipeline.compiledCacheRoutes) {
					pipeline.compiledCacheRoutes = compileCacheRoutes(
						pipeline.cacheConfig.routes,
						pipeline.manifest.base,
						pipeline.manifest.trailingSlash,
					);
				}
				const matched = matchCacheRoute(state.pathname, pipeline.compiledCacheRoutes);
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
export class CacheHandler {
	#app: BaseApp<Pipeline>;

	constructor(app: BaseApp<Pipeline>) {
		this.#app = app;
	}

	async handle(state: FetchState, next: () => Promise<Response>): Promise<Response> {
		this.#app.pipeline.usedFeatures |= PipelineFeatures.cache;
		if (!this.#app.pipeline.cacheProvider) {
			return next();
		}

		const cache = state.resolve<CacheLike>(CACHE_KEY);
		const cacheProvider = await this.#app.pipeline.getCacheProvider();

		if (cacheProvider?.onRequest) {
			const response = await cacheProvider.onRequest(
				{
					request: state.request,
					url: new URL(state.request.url),
					waitUntil: state.renderOptions.waitUntil,
				},
				async () => {
					const res = await next();
					applyCacheHeaders(cache!, res);
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
		applyCacheHeaders(cache!, response);
		return response;
	}
}
