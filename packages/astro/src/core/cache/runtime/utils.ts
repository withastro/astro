import type { CacheHint, CacheOptions, LiveDataEntry } from '../types.js';

/**
 * Generate default cache response headers from CacheOptions.
 * Used when the provider doesn't supply its own `setHeaders()`.
 */
export function defaultSetHeaders(options: CacheOptions): Headers {
	const headers = new Headers();

	// CDN-Cache-Control
	const directives: string[] = [];
	if (options.maxAge !== undefined) {
		directives.push(`max-age=${options.maxAge}`);
	}
	if (options.swr !== undefined) {
		directives.push(`stale-while-revalidate=${options.swr}`);
	}
	if (directives.length > 0) {
		headers.set('CDN-Cache-Control', directives.join(', '));
	}

	// Cache-Tag
	if (options.tags && options.tags.length > 0) {
		headers.set('Cache-Tag', options.tags.join(', '));
	}

	// Last-Modified
	if (options.lastModified) {
		headers.set('Last-Modified', options.lastModified.toUTCString());
	}

	// ETag
	if (options.etag) {
		headers.set('ETag', options.etag);
	}

	// Prevent browser heuristic freshness (RFC 9111 §4.2.2) when a validator
	// is present but no browser-facing Cache-Control has been set. Without this,
	// browsers cache the response silently based on Last-Modified age, making
	// tag-based invalidation and redeployments ineffective for affected visitors.
	const hasValidator = headers.has('Last-Modified') || headers.has('ETag');
	if (hasValidator && !headers.has('Cache-Control')) {
		headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
	}

	return headers;
}

export function isCacheHint(value: unknown): value is CacheHint {
	return value != null && typeof value === 'object' && 'tags' in value;
}

export function isLiveDataEntry(value: unknown): value is LiveDataEntry {
	return (
		value != null &&
		typeof value === 'object' &&
		'id' in value &&
		'data' in value &&
		'cacheHint' in value
	);
}
