import { INTERNAL_RESPONSE_HEADERS, responseSentSymbol } from '../constants.js';
import { getSetCookiesFromResponse } from '../cookies/index.js';

/**
 * Strips internal-only headers from the response before sending it to the
 * user agent, and optionally appends cookies written via `Astro.cookie.set()`
 * to the `Set-Cookie` header.
 *
 * This is a pure function with no dependencies on the app; it is shared by
 * `AstroHandler` and the various error handlers.
 */
export function prepareResponse(
	response: Response,
	{ addCookieHeader }: { addCookieHeader: boolean },
): void {
	for (const headerName of INTERNAL_RESPONSE_HEADERS) {
		if (response.headers.has(headerName)) {
			response.headers.delete(headerName);
		}
	}

	if (addCookieHeader) {
		for (const setCookieHeaderValue of getSetCookiesFromResponse(response)) {
			response.headers.append('set-cookie', setCookieHeaderValue);
		}
	}

	Reflect.set(response, responseSentSymbol, true);
}
