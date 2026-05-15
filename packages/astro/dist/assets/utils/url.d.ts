/**
 * Creates a URL object from a path or URL string, using a placeholder base for relative paths.
 * This allows safe manipulation of URLs using the native URL API.
 *
 * @param pathOrUrl - A relative path (e.g., '/_astro/image.png') or absolute URL (e.g., 'https://cdn.example.com/...')
 * @returns A URL object that can be safely manipulated
 */
export declare function createPlaceholderURL(pathOrUrl: string): URL;
/**
 * Extracts the pathname and search parameters from a URL created with `createPlaceholderURL`.
 * Removes the placeholder base, returning just the path and query string.
 *
 * @param url - A URL object created with `createPlaceholderURL`
 * @returns The URL string without the placeholder base
 */
export declare function stringifyPlaceholderURL(url: URL): string;
