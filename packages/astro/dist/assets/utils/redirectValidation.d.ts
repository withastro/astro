/**
 * Utilities for handling HTTP redirects with validation
 */
import type { AstroConfig } from '../../types/public/config.js';
export type RemoteImageConfig = Pick<AstroConfig['image'], 'remotePatterns' | 'domains'>;
export type FetchRedirectOptions = {
	/**
	 * URL to fetch (either string or URL object)
	 */
	url: string | URL;
	/**
	 * Headers to include in the request (optional)
	 */
	headers?: Headers;
	/**
	 * Image config for validating redirect destinations (optional)
	 */
	imageConfig: RemoteImageConfig;
	/**
	 * Fetch function to use (default: globalThis.fetch)
	 */
	fetchFn?: typeof fetch;
	/**
	 * Maximum number of redirects to follow (default: 10)
	 */
	redirectLimit?: number;
	/**
	 * Error handler for redirect depth exceeded (default: generic Error)
	 */
	onMaxRedirectsExceeded?: (url: string) => Error;
	/**
	 * Error handler for missing Location header (default: generic Error)
	 */
	onMissingLocationHeader?: (status: number, url: string) => Error;
	/**
	 * Error handler for disallowed redirect (default: generic Error)
	 */
	onDisallowedRedirect?: (currentUrl: string, targetUrl: string) => Error;
};
/**
 * Recursively follows HTTP redirects with validation according to the image configuration.
 *
 * If any of the domains in the redirect chain are not allowed by either `image.remotePatterns`
 * or `image.domains`, this function will throw an error for a disallowed redirect.
 *
 * @param options The options for this fetch call.
 */
export declare function fetchWithRedirects(options: FetchRedirectOptions): Promise<Response>;
