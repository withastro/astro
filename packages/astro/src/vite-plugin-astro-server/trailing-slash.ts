import {
	collapseDuplicateTrailingSlashes,
	hasFileExtension,
	isInternalPath,
} from '@astrojs/internal-helpers/path';
import type * as vite from 'vite';
import { trailingSlashMismatchTemplate } from '../template/4xx.js';
import type { AstroSettings } from '../types/astro.js';
import { writeHtmlResponse, writeRedirectResponse } from './response.js';

export function trailingSlashMiddleware(settings: AstroSettings): vite.Connect.NextHandleFunction {
	const { trailingSlash } = settings.config;

	return function devTrailingSlash(req, res, next) {
		const url = new URL(`http://localhost${req.url}`);
		let pathname: string;
		try {
			pathname = decodeURI(url.pathname);
		} catch (e) {
			/* malformed uri */
			return next(e);
		}
		if (isInternalPath(pathname)) {
			return next();
		}

		const destination = collapseDuplicateTrailingSlashes(pathname, true);
		if (pathname && destination !== pathname) {
			return writeRedirectResponse(res, 301, `${destination}${url.search}`);
		}

		if (
			(trailingSlash === 'never' && pathname.endsWith('/') && pathname !== '/') ||
			(trailingSlash === 'always' && !pathname.endsWith('/') && !hasFileExtension(pathname))
		) {
			const html = trailingSlashMismatchTemplate(pathname, trailingSlash);
			return writeHtmlResponse(res, 404, html);
		}
		return next();
	};
}
