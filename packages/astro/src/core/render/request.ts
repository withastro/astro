import type { Params } from '../../@types/astro';
import { canonicalURL as utilCanonicalURL } from '../util.js';

type Site = string | undefined;

export interface AstroRequest {
	/** get the current page URL */
	url: URL;

	/** get the current canonical URL */
	canonicalURL: URL;

	/** get page params (dynamic pages only) */
	params: Params;

	headers: Headers;

	method: string;
}

export type AstroRequestSSR = AstroRequest;

export function createRequest(method: string, pathname: string, headers: Headers, origin: string, site: Site, ssr: boolean): AstroRequest {
	const url = new URL('.' + pathname, new URL(origin));

	const canonicalURL = utilCanonicalURL('.' + pathname, site ?? url.origin);

	const request: AstroRequest = {
		url,
		canonicalURL,
		params: {},
		headers,
		method,
	};

	if (!ssr) {
		// Headers are only readable if using SSR-mode. If not, make it an empty headers
		// object, so you can't do something bad.
		request.headers = new Headers();

		// Disallow using query params.
		request.url = new URL(request.url);

		for (const [key] of request.url.searchParams) {
			request.url.searchParams.delete(key);
		}
	}

	return request;
}
