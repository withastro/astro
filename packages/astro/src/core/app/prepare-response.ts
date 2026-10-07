import { responseSentSymbol } from '../constants.js';
import { getSetCookiesFromResponse } from '../cookies/index.js';

/**
 * Appends cookies written via `Astro.cookie.set()` to the `Set-Cookie` header
 * and marks the response as sent.
 *
 * Returns the response to send: the given one, or a copy of it when its
 * headers are immutable and cookies need to be added.
 *
 * This is a pure function with no dependencies on the app; it is shared by
 * `handleRequest` and the various error handlers.
 */
export function prepareResponse(
	response: Response,
	{ addCookieHeader }: { addCookieHeader: boolean },
): Response {
	if (addCookieHeader) {
		const setCookieHeaders = Array.from(getSetCookiesFromResponse(response));
		if (setCookieHeaders.length > 0) {
			try {
				for (const setCookieHeaderValue of setCookieHeaders) {
					response.headers.append('set-cookie', setCookieHeaderValue);
				}
			} catch {
				// Responses from `Response.redirect()` and `fetch()` have immutable headers.
				// The first append throws before changing anything, so the copy gets every cookie.
				response = new Response(response.body, response);
				for (const setCookieHeaderValue of setCookieHeaders) {
					response.headers.append('set-cookie', setCookieHeaderValue);
				}
			}
		}
	}

	Reflect.set(response, responseSentSymbol, true);
	return response;
}
