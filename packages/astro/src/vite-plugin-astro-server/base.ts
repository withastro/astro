import type * as vite from 'vite';
import type { AstroSettings } from '../@types/astro';

import { LogOptions } from '../core/logger/core.js';
import notFoundTemplate, { subpathNotUsedTemplate } from '../template/4xx.js';
import { log404 } from './common.js';
import { writeHtmlResponse } from './response.js';

export function baseMiddleware(
	settings: AstroSettings,
	logging: LogOptions
): vite.Connect.NextHandleFunction {
	const { config } = settings;
	const site = config.site ? new URL(config.base, config.site) : undefined;
	const devRoot = site ? site.pathname : '/';

	return function devBaseMiddleware(req, res, next) {
		const url = req.url!;

		const pathname = decodeURI(new URL(url, 'http://vitejs.dev').pathname);

		if (pathname.startsWith(devRoot)) {
			req.url = url.replace(devRoot, '/');
			return next();
		}

		if (pathname === '/' || pathname === '/index.html') {
			log404(logging, pathname);
			const html = subpathNotUsedTemplate(devRoot, pathname);
			return writeHtmlResponse(res, 404, html);
		}

		if (req.headers.accept?.includes('text/html')) {
			log404(logging, pathname);
			const html = notFoundTemplate({
				statusCode: 404,
				title: 'Not found',
				tabTitle: '404: Not Found',
				pathname,
			});
			return writeHtmlResponse(res, 404, html);
		}

		next();
	};
}
