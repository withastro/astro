import { collapseDuplicateSlashes } from '@astrojs/internal-helpers/path';
import { validateAndDecodePathname } from './pathname.js';

/**
 * Creates a normalized URL from a request URL string.
 * Decodes and validates the pathname, collapses duplicate slashes.
 */
export function createNormalizedUrl(requestUrl: string): URL {
	const url = new URL(requestUrl);
	try {
		url.pathname = validateAndDecodePathname(url.pathname);
	} catch {
		try {
			url.pathname = decodeURI(url.pathname);
		} catch {
			// If even basic decoding fails, return URL as-is
		}
	}
	url.pathname = collapseDuplicateSlashes(url.pathname);
	return url;
}
