import type { MiddlewareNext } from '../../types/public/common.js';

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
	setHeaders?(options: CacheOptions): Headers;
	onRequest?(context: { request: Request; url: URL }, next: MiddlewareNext): Promise<Response>;
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
