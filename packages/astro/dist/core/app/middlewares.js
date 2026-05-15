import { defineMiddleware } from '../middleware/defineMiddleware.js';
const FORM_CONTENT_TYPES = [
	'application/x-www-form-urlencoded',
	'multipart/form-data',
	'text/plain',
];
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];
function createOriginCheckMiddleware() {
	return defineMiddleware((context, next) => {
		const { request, url, isPrerendered } = context;
		if (isPrerendered) {
			return next();
		}
		if (SAFE_METHODS.includes(request.method)) {
			return next();
		}
		const isSameOrigin = request.headers.get('origin') === url.origin;
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
function hasFormLikeHeader(contentType) {
	if (contentType) {
		for (const FORM_CONTENT_TYPE of FORM_CONTENT_TYPES) {
			if (contentType.toLowerCase().includes(FORM_CONTENT_TYPE)) {
				return true;
			}
		}
	}
	return false;
}
export { createOriginCheckMiddleware, hasFormLikeHeader };
