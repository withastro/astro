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
 * Assigns `url.pathname` only when it would actually change it.
 *
 * Writing `url.pathname` re-parses and re-serializes the whole URL, which costs
 * more than parsing a URL from scratch. An ordinary request path (`/about`) is
 * already decoded and free of duplicate slashes, so normalizing it assigns the
 * value it already has, twice, and pays that cost both times. Skipping the write
 * when the value is unchanged is what makes normalization cheap on the hot path.
 *
 * Used by `normalizeUrl` here and by the `FetchState` constructor, which runs
 * the same decode-then-collapse sequence inline on every SSR request.
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
 * The collapse must stay *after* the decode is written back, not folded into
 * it: the pathname setter rewrites `\` to `/`, so a decoded backslash only
 * becomes a duplicate slash once it has been assigned (`/a%5C/b` -> `/a\/b` ->
 * `/a//b` -> `/a/b`). Collapsing the decoded string instead would leave `//`.
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
