/**
 * Utility function that creates a new `Request` with a new URL from an old `Request`.
 * 
 * @param newUrl The new `URL`
 * @param oldRequest The old `Request`
 */
export async function copyRequest(newUrl: URL, oldRequest: Request): Promise<Request> {
		return new Request(newUrl, {
			method: oldRequest.method,
			headers: oldRequest.headers,
			body: oldRequest.body,
			referrer: oldRequest.referrer,
			referrerPolicy: oldRequest.referrerPolicy,
			mode: oldRequest.mode,
			credentials: oldRequest.credentials,
			cache: oldRequest.cache,
			redirect: oldRequest.redirect,
			integrity: oldRequest.integrity,
			signal: oldRequest.signal,
			keepalive: oldRequest.keepalive,
			// https://fetch.spec.whatwg.org/#dom-request-duplex
			// @ts-expect-error It isn't part of the types, but undici accepts it and it allows to carry over the body to a new request
			duplex: "half"
		})
}
