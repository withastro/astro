import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import type { Connect, Plugin } from 'vite';
import { notFoundTemplate, subpathNotUsedTemplate } from '../../template/4xx.js';
import type { AstroSettings } from '../../types/astro.js';
import { trailingSlashMiddleware } from '../../vite-plugin-utils/index.js';
import type { Logger } from '../logger/core.js';

export function vitePluginAstroPreview(settings: AstroSettings, logger: Logger): Plugin {
	const { base, outDir, trailingSlash } = settings.config;

	function handle404(req: IncomingMessage, res: ServerResponse) {
		const errorPagePath = fileURLToPath(outDir + '/404.html');
		if (fs.existsSync(errorPagePath)) {
			res.statusCode = 404;
			res.setHeader('Content-Type', 'text/html;charset=utf-8');
			res.end(fs.readFileSync(errorPagePath));
		} else {
			res.statusCode = 404;
			res.end(notFoundTemplate(req.url!, 'Not Found'));
		}
	}

	return {
		name: 'astro:preview',
		apply: 'serve',
		configurePreviewServer(server) {
			server.middlewares.use((req, res, next) => {
				// respond 404 to requests outside the base request directory
				if (!req.url!.startsWith(base)) {
					res.statusCode = 404;
					res.end(subpathNotUsedTemplate(base, req.url!));
					return;
				}

				// TODO: look into why the replacement needs to happen here
				for (const middleware of server.middlewares.stack) {
					// This hardcoded name will not break between Vite versions
					if ((middleware.handle as Connect.HandleFunction).name === 'vite404Middleware') {
						middleware.handle = handle404;
					}
				}

				next();
			});

			server.middlewares.use(trailingSlashMiddleware(trailingSlash, logger));
		},
	};
}
