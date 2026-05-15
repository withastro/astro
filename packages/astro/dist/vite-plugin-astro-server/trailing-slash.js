import {
	collapseDuplicateTrailingSlashes,
	hasFileExtension,
	isInternalPath,
} from '@astrojs/internal-helpers/path';
import { trailingSlashMismatchTemplate } from '../template/4xx.js';
import { writeHtmlResponse, writeRedirectResponse } from './response.js';
function evaluateTrailingSlash(pathname, search, trailingSlash) {
	if (isInternalPath(pathname)) {
		return { action: 'next' };
	}
	const collapsed = collapseDuplicateTrailingSlashes(pathname, true);
	if (pathname && collapsed !== pathname) {
		return { action: 'redirect', status: 301, location: `${collapsed}${search}` };
	}
	if (
		(trailingSlash === 'never' && pathname.endsWith('/') && pathname !== '/') ||
		(trailingSlash === 'always' && !pathname.endsWith('/') && !hasFileExtension(pathname))
	) {
		return { action: 'reject', status: 404, pathname };
	}
	return { action: 'next' };
}
function trailingSlashMiddleware(settings) {
	const { trailingSlash } = settings.config;
	return function devTrailingSlash(req, res, next) {
		const url = new URL(`http://localhost${req.url}`);
		let pathname;
		try {
			pathname = decodeURI(url.pathname);
		} catch (e) {
			return next(e);
		}
		const decision = evaluateTrailingSlash(pathname, url.search, trailingSlash);
		switch (decision.action) {
			case 'redirect':
				return writeRedirectResponse(res, decision.status, decision.location);
			case 'reject': {
				const html = trailingSlashMismatchTemplate(decision.pathname, trailingSlash);
				return writeHtmlResponse(res, decision.status, html);
			}
			case 'next':
				return next();
		}
	};
}
export { evaluateTrailingSlash, trailingSlashMiddleware };
