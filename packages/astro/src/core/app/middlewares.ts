import type { MiddlewareHandler } from '../../types/public/common.js';
import { ACTION_QUERY_PARAMS, ACTION_RPC_ROUTE_PATTERN } from '../../actions/consts.js';
import { defineMiddleware } from '../middleware/defineMiddleware.js';

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

// Note: TRACE is unsupported by undici/Node.js
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Returns a middleware function in charge to check the `origin` header.
 *
 * @private
 */
export function createOriginCheckMiddleware(): MiddlewareHandler {
	return defineMiddleware((context, next) => {
		const { request, url, isPrerendered, routePattern } = context;
		// Prerendered pages should be excluded
		if (isPrerendered) {
			return next();
		}
		// Safe methods don't require origin check
		if (SAFE_METHODS.includes(request.method)) {
			return next();
		}

		// Reconstruct the expected origin from the Host request header, which is
		// reliable even behind proxies. url.origin can be wrong (e.g. missing port)
		// because the node adapter may fall back to 'localhost' without port.
		const hostHeader = request.headers.get('host');
		const expectedOrigin = hostHeader ? `${url.protocol}//${hostHeader}` : url.origin;

		const originHeader = request.headers.get('origin');
		const isSameOrigin = originHeader === expectedOrigin;

		// Check if this is an action endpoint
		const isActionRpc = routePattern === ACTION_RPC_ROUTE_PATTERN;
		const isActionForm = url.searchParams.has(ACTION_QUERY_PARAMS.actionName);
		const isActionEndpoint = isActionRpc || isActionForm;

		if (isActionEndpoint) {
			// For action endpoints, enforce origin check regardless of content type.
			// This closes the bypass where non-form Content-Types (e.g. application/json)
			// were never validated against the Origin header.
			if (originHeader && !isSameOrigin) {
				return new Response(`Cross-site ${request.method} action submissions are forbidden`, {
					status: 403,
				});
			}

			// No Origin header: check Referer as fallback per OWASP guidance.
			if (!originHeader) {
				const refererHeader = request.headers.get('referer');
				if (refererHeader) {
					let refererOrigin: string;
					if (URL.canParse(refererHeader)) {
						refererOrigin = new URL(refererHeader).origin;
					} else {
						return new Response(`Cross-site ${request.method} action submissions are forbidden`, {
							status: 403,
						});
					}
					if (refererOrigin !== expectedOrigin) {
						return new Response(`Cross-site ${request.method} action submissions are forbidden`, {
							status: 403,
						});
					}
				}
				// Neither Origin nor Referer present: allow.
				// Non-browser clients that omit both headers bypass CSRF protection
				// regardless; defending against them requires token-based CSRF or auth.
			}

			return next();
		}

		// For non-action endpoints, preserve the original behaviour:
		// only enforce origin check for form-like content types.
		const hasContentType = request.headers.has('content-type');
		if (hasContentType) {
			const formLikeHeader = hasFormLikeHeader(request.headers.get('content-type'));
			if (formLikeHeader && !isSameOrigin) {
				return new Response(`Cross-site ${request.method} form submissions are forbidden`, {
					status: 403,
				});
			}
		} else {
			if (!isSameOrigin) {
				return new Response(`Cross-site ${request.method} form submissions are forbidden`, {
					status: 403,
				});
			}
		}

		return next();
	});
}

function hasFormLikeHeader(contentType: string | null): boolean {
	if (contentType) {
		for (const FORM_CONTENT_TYPE of FORM_CONTENT_TYPES) {
			if (contentType.toLowerCase().includes(FORM_CONTENT_TYPE)) {
				return true;
			}
		}
	}
	return false;
}
