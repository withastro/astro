/**
 * Strips internal-only headers from the response before sending it to the
 * user agent, and optionally appends cookies written via `Astro.cookie.set()`
 * to the `Set-Cookie` header.
 *
 * This is a pure function with no dependencies on the app; it is shared by
 * `AstroHandler` and the various error handlers.
 */
export declare function prepareResponse(
	response: Response,
	{
		addCookieHeader,
	}: {
		addCookieHeader: boolean;
	},
): void;
