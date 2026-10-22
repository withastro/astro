import type { FetchState } from '../fetch/fetch-state.js';

/**
 * Returns an empty `400 Bad Request` response when the request path was
 * encoded too many times to fully decode (`state.invalidEncoding`), or
 * `undefined` otherwise.
 *
 * Every entry point that routes the request or runs middleware calls this
 * first, so composable pipelines reject the request the same way
 * `handleRequest` does regardless of which handlers they include.
 */
export function rejectInvalidEncoding(state: FetchState): Response | undefined {
	// If the half-decoded path were let through, middleware could check one
	// path while a later decode turns it into a different route.
	if (state.invalidEncoding) {
		return new Response(null, { status: 400, statusText: 'Bad Request' });
	}
	return undefined;
}
