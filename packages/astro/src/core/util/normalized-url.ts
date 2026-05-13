import { collapseDuplicateSlashes } from '@astrojs/internal-helpers/path';
import { MultiLevelEncodingError, validateAndDecodePathname } from './pathname.js';

/**
 * Creates a normalized URL from a request URL string.
 * Decodes and validates the pathname, collapses duplicate slashes.
 */
export function createNormalizedUrl(requestUrl: string): URL {
	return normalizeUrl(new URL(requestUrl));
}

/**
 * Normalizes an already-parsed URL in place: decodes and validates the
 * pathname, collapses duplicate slashes. Returns the same URL object.
 */
export function normalizeUrl(url: URL): URL {
	try {
		url.pathname = validateAndDecodePathname(url.pathname);
	} catch (e) {
		// Multi-level encoding (e.g., %2561 → %61) must be rejected, not silently decoded.
		// Let this error propagate so the caller can return a 400 response.
		if (e instanceof MultiLevelEncodingError) {
			throw e;
		}
		// For other decoding failures (truly malformed URLs), fall back gracefully.
		try {
			url.pathname = decodeURI(url.pathname);
		} catch {
			// If even basic decoding fails, return URL as-is
		}
	}
	url.pathname = collapseDuplicateSlashes(url.pathname);
	return url;
}
