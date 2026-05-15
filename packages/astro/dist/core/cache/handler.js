import { PipelineFeatures } from '../base-pipeline.js';
import { AstroCache, applyCacheHeaders } from './runtime/cache.js';
import { NoopAstroCache, DisabledAstroCache } from './runtime/noop.js';
import { compileCacheRoutes, matchCacheRoute } from './runtime/route-matching.js';
const CACHE_KEY = 'cache';
function provideCache(state) {
	const pipeline = state.pipeline;
	if (!pipeline.cacheConfig) {
		state.provide(CACHE_KEY, {
			create: () => new DisabledAstroCache(pipeline.logger),
		});
		return;
	}
	if (pipeline.runtimeMode === 'development') {
		state.provide(CACHE_KEY, {
			create: () => new NoopAstroCache(),
		});
		return;
	}
	return provideCacheAsync(state, pipeline);
}
async function provideCacheAsync(state, pipeline) {
	const cacheProvider = await pipeline.getCacheProvider();
	state.provide(CACHE_KEY, {
		create() {
			const cache = new AstroCache(cacheProvider);
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
class CacheHandler {
	#app;
	constructor(app) {
		this.#app = app;
	}
	async handle(state, next) {
		this.#app.pipeline.usedFeatures |= PipelineFeatures.cache;
		if (!this.#app.pipeline.cacheProvider) {
			return next();
		}
		const cache = state.resolve(CACHE_KEY);
		const cacheProvider = await this.#app.pipeline.getCacheProvider();
		if (cacheProvider?.onRequest) {
			const response2 = await cacheProvider.onRequest(
				{
					request: state.request,
					url: new URL(state.request.url),
					waitUntil: state.renderOptions.waitUntil,
				},
				async () => {
					const res = await next();
					applyCacheHeaders(cache, res);
					return res;
				},
			);
			response2.headers.delete('CDN-Cache-Control');
			response2.headers.delete('Cache-Tag');
			return response2;
		}
		const response = await next();
		applyCacheHeaders(cache, response);
		return response;
	}
}
export { CacheHandler, provideCache };
