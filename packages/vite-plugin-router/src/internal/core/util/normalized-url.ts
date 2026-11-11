import { collapseDuplicateSlashes } from '@astrojs/internal-helpers/path';
import { validateAndDecodePathname } from './pathname.js';

/**
 * Creates a normalized URL from a request URL string.
 * Decodes and validates the pathname, collapses duplicate slashes.
 */
export function createNormalizedUrl(requestUrl: string): URL {
	return normalizeUrl(new URL(requestUrl));
}

/**
 * Assigns `url.pathname` only when the value differs.
 * The setter re-parses the whole URL, so a no-op write is still expensive.
 */
export function setPathname(url: URL, pathname: string): void {
	if (url.pathname !== pathname) {
		url.pathname = pathname;
	}
}

/**
 * Normalizes an already-parsed URL in place: decodes and validates the
 * pathname, collapses duplicate slashes. Returns the same URL object.
 *
 * Collapse runs after the decode is written back: the pathname setter
 * rewrites `\` to `/`, so a decoded backslash only becomes `//` once assigned.
 */
export function normalizeUrl(url: URL): URL {
	try {
		setPathname(url, validateAndDecodePathname(url.pathname));
	} catch {
		// For decoding failures (truly malformed URLs), fall back gracefully.
		try {
			setPathname(url, decodeURI(url.pathname));
		} catch {
			// If even basic decoding fails, return URL as-is
		}
	}
	setPathname(url, collapseDuplicateSlashes(url.pathname));
	return url;
}
