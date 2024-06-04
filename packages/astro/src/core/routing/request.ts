/**
 * Utility function that creates a new `Request` with a new URL from an old `Request`.
 * 
 * @param newUrl The new `URL`
 * @param oldRequest The old `Request`
 */
export async function copyRequest(newUrl: URL, oldRequest: Request): Promise<Request> {
	const body = oldRequest.headers.get('content-type') ? oldRequest.blob() : Promise.resolve(undefined);
	return body.then((requestBody) => {
		return new Request(newUrl, {
			method: oldRequest.method,
			headers: oldRequest.headers,
			body: requestBody,
			referrer: oldRequest.referrer,
			referrerPolicy: oldRequest.referrerPolicy,
			mode: oldRequest.mode,
			credentials: oldRequest.credentials,
			cache: oldRequest.cache,
			redirect: oldRequest.redirect,
			integrity: oldRequest.integrity,
			signal: oldRequest.signal,
			keepalive: oldRequest.keepalive,
		})
	}
			
		);
}
