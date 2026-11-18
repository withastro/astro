export function applyCloudflareResponseHeaders(
	response: Response,
	setCookieHeaders: Iterable<string>,
	cacheProviderEnabled: boolean,
): Response {
	const cookies = [...setCookieHeaders];
	// Cloudflare's Worker cache otherwise caches all GET responses for up to
	// two hours when a route does not declare cache intent.
	const needsNoStoreDefault =
		cacheProviderEnabled && !response.headers.has('Cloudflare-CDN-Cache-Control');

	if (cookies.length > 0 || needsNoStoreDefault) {
		const applyHeaders = (target: Response) => {
			for (const cookie of cookies) {
				target.headers.append('Set-Cookie', cookie);
			}
			if (needsNoStoreDefault) {
				target.headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
			}
		};
		try {
			applyHeaders(response);
		} catch {
			// Responses served from the Workers Cache API have immutable headers. The
			// first mutation throws before changing anything, so reapplying is safe.
			response = new Response(response.body, response);
			applyHeaders(response);
		}
	}

	return response;
}
