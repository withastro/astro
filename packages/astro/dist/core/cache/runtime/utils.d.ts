import type { CacheHint, CacheOptions, LiveDataEntry } from '../types.js';
/**
 * Generate default cache response headers from CacheOptions.
 * Used when the provider doesn't supply its own `setHeaders()`.
 */
export declare function defaultSetHeaders(options: CacheOptions): Headers;
export declare function isCacheHint(value: unknown): value is CacheHint;
export declare function isLiveDataEntry(value: unknown): value is LiveDataEntry;
