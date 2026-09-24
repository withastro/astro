/**
 * Shared utilities for CDN cache providers.
 *
 * These helpers are used by first-party adapter cache providers
 * (@astrojs/netlify/cache, @astrojs/vercel/cache, @astrojs/cloudflare/cache)
 * to implement common patterns like cache-control header generation,
 * path-based invalidation via tags, and tag normalization.
 */
import type { CacheOptions, InvalidateOptions } from './types.js';

/**
 * Prefix used for auto-generated path tags.
 * Responses are tagged with `astro-path:{pathname}` so that
 * `invalidate({ path })` can be implemented via tag-based purge
 * on platforms that don't support native path invalidation.
 */
const PATH_TAG_PREFIX = 'astro-path:';

/**
 * Generate a cache tag for a given path.
 * Used by Netlify and Vercel providers to support `invalidate({ path })`.
 */
export function pathTag(path: string): string {
	return `${PATH_TAG_PREFIX}${path}`;
}

/**
 * Build cache-control directives from CacheOptions.
 * Returns the directive string (e.g. `"public, max-age=300, stale-while-revalidate=60"`)
 * without the header name, so each provider can use its own header
 * (`Netlify-CDN-Cache-Control`, `Vercel-CDN-Cache-Control`, `Cloudflare-CDN-Cache-Control`).
 *
 * Returns `undefined` if no caching directives are present.
 */
export function buildCacheControlDirectives(
	options: CacheOptions,
	extraDirectives?: string[],
): string | undefined {
	const directives: string[] = [];

	if (extraDirectives) {
		directives.push(...extraDirectives);
	}

	if (options.maxAge !== undefined) {
		directives.push(`max-age=${options.maxAge}`);
	}

	if (options.swr !== undefined) {
		directives.push(`stale-while-revalidate=${options.swr}`);
	}

	return directives.length > 0 ? directives.join(', ') : undefined;
}

/**
 * Set common conditional headers (Last-Modified, ETag) on a Headers object.
 */
export function setConditionalHeaders(headers: Headers, options: CacheOptions): void {
	if (options.lastModified) {
		headers.set('Last-Modified', options.lastModified.toUTCString());
	}
	if (options.etag) {
		headers.set('ETag', options.etag);
	}
}

/**
 * Normalize `InvalidateOptions.tags` to a flat string array.
 */
export function normalizeTags(tags: string | string[] | undefined): string[] {
	if (!tags) return [];
	return Array.isArray(tags) ? tags : [tags];
}

/**
 * Collect all tags needed to invalidate the given options,
 * including the path tag if `options.path` is set.
 * Used by providers that implement path invalidation via tags
 * (Netlify, Vercel) rather than native path purge (Cloudflare).
 */
export function collectInvalidationTags(options: InvalidateOptions): string[] {
	const tags = normalizeTags(options.tags);
	if (options.path) {
		tags.push(pathTag(options.path));
	}
	return tags;
}
