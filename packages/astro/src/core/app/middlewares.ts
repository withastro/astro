import type { MiddlewareHandler } from '../../@types/astro.js';
import { defineMiddleware } from '../middleware/index.js';

/**
 * Content types that can be passed when sending a request via a form
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/enctype
 * @private
 */
const FORM_CONTENT_TYPES = [
	'application/x-www-form-urlencoded',
	'multipart/form-data',
	'text/plain',
];

/**
 * Returns a middleware function in charge to check the `origin` header.
 *
 * @private
 */
export function createOriginCheckMiddleware(): MiddlewareHandler {
	return defineMiddleware((context, next) => {
		const { request, url } = context;
		const contentType = request.headers.get('content-type');
		if (contentType) {
			if (FORM_CONTENT_TYPES.includes(contentType.toLowerCase())) {
				const forbidden =
					(request.method === 'POST' ||
						request.method === 'PUT' ||
						request.method === 'PATCH' ||
						request.method === 'DELETE') &&
					request.headers.get('origin') !== url.origin;
				if (forbidden) {
					return new Response(`Cross-site ${request.method} form submissions are forbidden`, {
						status: 403,
					});
				}
			}
		}
		return next();
	});
}
