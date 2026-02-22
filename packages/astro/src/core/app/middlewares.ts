import type { MiddlewareHandler } from '../../types/public/common.js';
import { defineMiddleware } from '../middleware/defineMiddleware.js';

// Note: TRACE is unsupported by undici/Node.js
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Returns a middleware function in charge to check the `origin` header.
 *
 * @private
 */
export function createOriginCheckMiddleware(): MiddlewareHandler {
	return defineMiddleware((context, next) => {
		const { request, url, isPrerendered } = context;

		// Prerendered pages should be excluded
		if (isPrerendered) {
			return next();
		}
		// Safe methods don't require origin check
		if (SAFE_METHODS.includes(request.method)) {
			return next();
		}

		switch (request.headers.get('sec-fetch-site')) {
			case '':
			case null:
				// No Sec-Fetch-Site header is present.
				// Fallthrough to check the Origin  header.
				break
			case 'same-origin':
			case 'none':
				return next();
			default:
				return new Response(`Cross-site ${request.method} requests are forbidden`, {
					status: 403,
				});
		}

		const origin = request.headers.get('origin');
		if (!origin || origin === '') {
			// Neither Sec-Fetch-Site nor Origin headers are present.
			// Either the request is same-origin or not a browser request.
			return next();
		}

		// Since the protocol is parsed and verified into the url, we could probably use it directly.
		if (origin === url.origin) {
			return next();
		}

		// this is what go does, not looking at the protocol(with a comment from the go implementation).
		/*
		const originUrl = new URL(origin);
		if (originUrl.host === url.host) {
			// The Origin header matches the Host header. Note that the Host header
			// doesn't include the scheme, so we don't know if this might be an
			// HTTP→HTTPS cross-origin request. We fail open, since all modern
			// browsers support Sec-Fetch-Site since 2023, and running an older
			// browser makes a clear security trade-off already. Sites can mitigate
			// this with HTTP Strict Transport Security (HSTS).
			return next();
		}*/

		return new Response(`Cross-site ${request.method} requests are forbidden`, {
			status: 403,
		});
	});
}
