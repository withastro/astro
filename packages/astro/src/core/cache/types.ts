import type { MiddlewareNext } from '../../types/public/common.js';
import type { AstroRuntimeLogger } from '../../types/public/context.js';
import type { WaitUntilHook } from '../wait-until.js';

export interface CacheOptions {
	maxAge?: number;
	swr?: number;
	tags?: string[];
	lastModified?: Date;
	etag?: string;
}

export interface CacheHint {
	tags?: string[];
	lastModified?: Date;
}

export interface LiveDataEntry {
	id: string;
	data: unknown;
	cacheHint?: CacheHint;
}

export interface InvalidateOptions {
	path?: string;
	tags?: string | string[];
}

export interface CacheProvider {
	name: string;
	setHeaders?(options: CacheOptions, request: Request): Headers;
	/**
	 * Return true to buffer this response before applying cache headers and
	 * returning from `next()`. Only called with `onRequest`, for GET responses
	 * with a body and a positive `maxAge` before streaming begins.
	 *
	 * Opt in only if the provider already needs the complete response body
	 * before making its storage decision (as `memoryCache()` does). Return false
	 * for responses that will not be stored, such as responses with cookies.
	 * This lets async layouts/components contribute directives or opt out before
	 * storage. This waits for the complete body, so do not opt in for infinite
	 * streams. Streaming/background-writing providers should leave it unset.
	 * It does not collect `maxAge` first set after streaming has begun.
	 */
	shouldBufferResponse?(response: Response, request: Request): boolean;
	onRequest?(
		context: {
			request: Request;
			url: URL;
			waitUntil?: WaitUntilHook;
			logger: AstroRuntimeLogger;
		},
		next: MiddlewareNext,
	): Promise<Response>;
	invalidate(options: InvalidateOptions): Promise<void>;
}

export type CacheProviderFactory<TConfig extends Record<string, any> = Record<string, any>> = (
	config: TConfig | undefined,
) => CacheProvider;

export interface CacheProviderConfig<TConfig extends Record<string, any> = Record<string, any>> {
	/** Optional display name for logs and errors */
	name?: string;
	/** URL or package import */
	entrypoint: string | URL;
	/** Serializable options used by the provider implementation */
	config?: TConfig;
}

export interface NormalizedCacheProviderConfig {
	name: string | undefined;
	entrypoint: string;
	config: Record<string, any> | undefined;
}

export interface SSRManifestCache {
	provider: string;
	options?: Record<string, any>;
	routes?: Record<string, CacheOptions>;
}

export interface RouteRule {
	/**
	 * Cache max-age in seconds.
	 */
	maxAge?: number;
	/**
	 * Stale-while-revalidate window in seconds.
	 */
	swr?: number;
	/**
	 * Cache tags for invalidation.
	 */
	tags?: string[];
}

export type RouteRules = Record<string, RouteRule>;
