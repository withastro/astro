import * as fs from 'node:fs';
import path from 'node:path';
import { appendForwardSlash, prependForwardSlash } from '@astrojs/internal-helpers/path';
import colors from 'piccolore';
import { notFoundTemplate, subpathNotUsedTemplate } from '../template/4xx.js';
import { writeHtmlResponse } from './response.js';
function resolveDevRoot(base, site) {
	const effectiveBase = base || '/';
	const siteUrl = site ? new URL(effectiveBase, site) : void 0;
	const devRootURL = new URL(effectiveBase, 'http://localhost');
	const devRoot = siteUrl ? siteUrl.pathname : devRootURL.pathname;
	const devRootReplacement = devRoot.endsWith('/') ? '/' : '';
	return { devRoot, devRootReplacement };
}
function evaluateBaseRewrite(url, pathname, acceptHeader, devRoot, devRootReplacement) {
	if (pathname.startsWith(devRoot)) {
		let newUrl = url.replace(devRoot, devRootReplacement);
		if (!newUrl.startsWith('/')) newUrl = prependForwardSlash(newUrl);
		return { action: 'rewrite', newUrl };
	}
	if (pathname === '/' || pathname === '/index.html') {
		return { action: 'not-found-subpath', pathname, devRoot };
	}
	if (acceptHeader?.includes('text/html')) {
		return { action: 'not-found', pathname };
	}
	return { action: 'check-public' };
}
function baseMiddleware(settings, logger) {
	const { config } = settings;
	const { devRoot, devRootReplacement } = resolveDevRoot(config.base, config.site);
	return function devBaseMiddleware(req, res, next) {
		const url = req.url;
		let pathname;
		try {
			pathname = decodeURI(new URL(url, 'http://localhost').pathname);
		} catch (e) {
			return next(e);
		}
		const decision = evaluateBaseRewrite(
			url,
			pathname,
			req.headers.accept,
			devRoot,
			devRootReplacement,
		);
		switch (decision.action) {
			case 'rewrite':
				req.url = decision.newUrl;
				return next();
			case 'not-found-subpath': {
				const html = subpathNotUsedTemplate(decision.devRoot, decision.pathname);
				return writeHtmlResponse(res, 404, html);
			}
			case 'not-found': {
				const html = notFoundTemplate(decision.pathname);
				return writeHtmlResponse(res, 404, html);
			}
			case 'check-public': {
				const publicPath = new URL('.' + req.url, config.publicDir);
				fs.stat(publicPath, (_err, stats) => {
					if (stats) {
						const publicDir = appendForwardSlash(
							path.posix.relative(config.root.pathname, config.publicDir.pathname),
						);
						const devRootURL = new URL(devRoot, 'http://localhost');
						const expectedLocation = new URL(devRootURL.pathname + url, devRootURL).pathname;
						logger.error(
							'router',
							`Request URLs for ${colors.bold(
								publicDir,
							)} assets must also include your base. "${expectedLocation}" expected, but received "${url}".`,
						);
						const html = subpathNotUsedTemplate(devRoot, pathname);
						return writeHtmlResponse(res, 404, html);
					} else {
						next();
					}
				});
			}
		}
	};
}
export { baseMiddleware, evaluateBaseRewrite, resolveDevRoot };
