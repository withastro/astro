import type {
	CacheHint,
	CacheOptions,
	CacheProvider,
	InvalidateOptions,
	LiveDataEntry,
} from '../types.js';
export interface CacheLike {
	/**
	 * Whether caching is enabled. `false` when no cache provider is configured
	 * or in dev mode. Libraries can check this before calling cache methods.
	 */
	readonly enabled: boolean;
	/**
	 * Set cache options for the current request. Call multiple times to merge options.
	 * Pass `false` to explicitly opt out of caching.
	 */
	set(input: CacheOptions | CacheHint | LiveDataEntry | false): void;
	/** All accumulated cache tags for this request. */
	readonly tags: string[];
	/** A read-only snapshot of the current cache options, including accumulated tags. */
	readonly options: Readonly<CacheOptions>;
	/**
	 * Purge cached entries by tag or path. Requires a cache provider to be configured.
	 */
	invalidate(input: InvalidateOptions | LiveDataEntry): Promise<void>;
}
export declare class AstroCache implements CacheLike {
	#private;
	readonly enabled = true;
	constructor(provider: CacheProvider | null);
	set(input: CacheOptions | CacheHint | LiveDataEntry | false): void;
	get tags(): string[];
	/**
	 * Get the current cache options (read-only snapshot).
	 * Includes all accumulated options: maxAge, swr, tags, etag, lastModified.
	 */
	get options(): Readonly<CacheOptions>;
	invalidate(input: InvalidateOptions | LiveDataEntry): Promise<void>;
}
/**
 * Apply cache headers to a response.
 */
export declare function applyCacheHeaders(cache: CacheLike, response: Response): void;
/**
 * Check whether the cache has any active state worth acting on.
 */
export declare function isCacheActive(cache: CacheLike): boolean;
