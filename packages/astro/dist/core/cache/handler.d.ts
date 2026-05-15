import type { BaseApp } from '../app/base.js';
import type { FetchState } from '../fetch/fetch-state.js';
import type { Pipeline } from '../base-pipeline.js';
/**
 * Registers a cache provider on the given `FetchState`. When
 * `state.resolve('cache')` is first called, the appropriate cache
 * implementation is created (disabled, noop for dev, or real).
 *
 * Returns synchronously when cache is not configured or in dev mode.
 */
export declare function provideCache(state: FetchState): Promise<void> | void;
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
export declare class CacheHandler {
	#private;
	constructor(app: BaseApp<Pipeline>);
	handle(state: FetchState, next: () => Promise<Response>): Promise<Response>;
}
