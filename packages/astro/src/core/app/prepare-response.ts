import { responseSentSymbol } from '../constants.js';
import { getSetCookiesFromResponse } from '../cookies/index.js';

/**
 * Appends cookies written via `Astro.cookie.set()` to the `Set-Cookie` header
 * and marks the response as sent.
 *
 * This is a pure function with no dependencies on the app; it is shared by
 * `AstroHandler` and the various error handlers.
 */
export function prepareResponse(
	response: Response,
	{ addCookieHeader }: { addCookieHeader: boolean },
): void {
	if (addCookieHeader) {
		for (const setCookieHeaderValue of getSetCookiesFromResponse(response)) {
			response.headers.append('set-cookie', setCookieHeaderValue);
		}
	}

	Reflect.set(response, responseSentSymbol, true);
}
