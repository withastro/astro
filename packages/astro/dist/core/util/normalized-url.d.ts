/**
 * Creates a normalized URL from a request URL string.
 * Decodes and validates the pathname, collapses duplicate slashes.
 */
export declare function createNormalizedUrl(requestUrl: string): URL;
/**
 * Normalizes an already-parsed URL in place: decodes and validates the
 * pathname, collapses duplicate slashes. Returns the same URL object.
 */
export declare function normalizeUrl(url: URL): URL;
