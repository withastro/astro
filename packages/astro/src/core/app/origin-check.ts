/**
 * Home of the `security.checkOrigin` logic. Exposes the shared predicate and
 * response used to reject cross-site submissions, plus the middleware factory
 * that installs the check in the request pipeline. Consumers (the pipeline
 * middleware and the Astro Actions dispatch) import from here so the check
 * stays consistent regardless of where it runs.
 */
import type { MiddlewareHandler } from '../../types/public/common.js';
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
 * Determines whether a request should be rejected because it is a cross-site
 * submission for a route rendered on demand.
 *
 * This encapsulates the shared logic used by both the origin-check middleware
 * and the Astro Actions dispatch, so the check is applied consistently
 * regardless of where the request is handled.
 *
 * @private
 */
export function isForbiddenCrossOriginRequest(
	request: Request,
	url: URL,
	isPrerendered: boolean,
): boolean {
	// Prerendered pages should be excluded
	if (isPrerendered) {
		return false;
	}
	// Safe methods don't require origin check
	if (SAFE_METHODS.includes(request.method)) {
		return false;
	}
	const isSameOrigin = request.headers.get('origin') === url.origin;

	const hasContentType = request.headers.has('content-type');
	if (hasContentType) {
		const formLikeHeader = hasFormLikeHeader(request.headers.get('content-type'));
		return formLikeHeader && !isSameOrigin;
	}
	return !isSameOrigin;
}

/**
 * Builds the 403 response returned when a cross-site submission is rejected.
 *
 * @private
 */
export function createCrossOriginForbiddenResponse(request: Request): Response {
	return new Response(`Cross-site ${request.method} form submissions are forbidden`, {
		status: 403,
	});
}

/**
 * Returns a middleware function in charge to check the `origin` header.
 *
 * @private
 */
export function createOriginCheckMiddleware(): MiddlewareHandler {
	return defineMiddleware((context, next) => {
		const { request, url, isPrerendered } = context;
		if (isForbiddenCrossOriginRequest(request, url, isPrerendered)) {
			return createCrossOriginForbiddenResponse(request);
		}
		return next();
	});
}

export function hasFormLikeHeader(contentType: string | null): boolean {
	if (contentType) {
		for (const FORM_CONTENT_TYPE of FORM_CONTENT_TYPES) {
			if (contentType.toLowerCase().includes(FORM_CONTENT_TYPE)) {
				return true;
			}
		}
	}
	return false;
}
