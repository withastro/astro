import type { MiddlewareNext } from '../../types/public/common.js';
import type { AstroRuntimeLogger } from '../../types/public/context.js';
import type { WaitUntilHook } from '../wait-until.js';

export interface CacheOptions extends CachePolicy {
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

export interface RouteRule extends CachePolicy {}

/** 
 * Set cache lifetime and invalidation policy
 * @property {number} maxAge?
 * @property {number} swr?
 * @property {string[]} tags?
 */
interface CachePolicy {
	/**
	 * Cache max-age in seconds before cache is invalidated.
	 */
	maxAge?: number;
	/**
	 * Stale-while-revalidate window in seconds, allows stale content to be fed for up to specified timeframe past invalidation.
	 */
	swr?: number;
	/**
	 * Cache tags for grouped invalidation actions.
	 * @example cache.invalidate({ tags:[ 'products', 'users:admin' ]})
	 */
	tags?: string[];
}
export type RouteRules = Record<string, RouteRule>;
