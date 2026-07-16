/**
 * Symbol used to cache the parsed `URL` of a `Request` on the request itself,
 * so that a request is parsed at most once no matter how many times the core
 * and the adapter each need its URL.
 */
const requestUrlSymbol = Symbol.for('astro.requestURL');

/**
 * Returns the parsed `URL` for a request, parsing `request.url` at most once
 * per request.
 *
 * The returned object is shared with everything else that asks for this
 * request's URL, so **treat it as read-only**. Code that needs to rewrite a URL
 * must build its own (`new URL(request.url)`); a `URL` is not worth cloning
 * defensively, because constructing one from another `URL` serializes and
 * re-parses it, and so costs more than parsing `request.url` again.
 *
 * The cached URL cannot disagree with the request, because `request.url` is
 * immutable per the Fetch spec and a rewritten request is a different object
 * with its own entry.
 */
export function getRequestURL(request: Request): URL {
	let url: URL | undefined = Reflect.get(request, requestUrlSymbol);
	if (url === undefined) {
		url = new URL(request.url);
		Reflect.set(request, requestUrlSymbol, url);
	}
	return url;
}

/**
 * Caches an already-parsed `URL` on a request, for callers that had to parse
 * `request.url` in order to build the `Request` in the first place.
 *
 * The URL must be the one the request was built from; callers that cannot
 * guarantee that should let {@link getRequestURL} do the parsing instead.
 */
export function setRequestURL(request: Request, url: URL): void {
	Reflect.set(request, requestUrlSymbol, url);
}
