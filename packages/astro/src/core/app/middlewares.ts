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
		const isSameOrigin = request.headers.get('origin') === url.origin;

		if (!isSameOrigin) {
			return new Response(`Cross-site ${request.method} form submissions are forbidden`, {
				status: 403,
			});
		}

		return next();
	});
}
