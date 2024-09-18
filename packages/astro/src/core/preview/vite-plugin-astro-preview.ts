import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import type { Connect, Plugin } from 'vite';
import { notFoundTemplate, subpathNotUsedTemplate } from '../../template/4xx.js';
import type { AstroSettings } from '../../types/astro.js';
import { cleanUrl } from '../../vite-plugin-utils/index.js';
import { joinPaths } from '../path.js';

export function vitePluginAstroPreview(settings: AstroSettings): Plugin {
	const { base, outDir } = settings.config;

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

			return () => {
				// NOTE: the `base` is stripped from `req.url` for post middlewares
				server.middlewares.use((req, res, next) => {
					const pathname = cleanUrl(req.url!);

					// Redirect /foo/ to /foo if /foo.html exists
					if (pathname.endsWith('/')) {
						const pathnameWithoutSlash = pathname.slice(0, -1);
						const htmlPath = fileURLToPath(outDir + pathnameWithoutSlash + '.html');
						if (fs.existsSync(htmlPath)) {
							res.writeHead(308, { Location: joinPaths(base, pathnameWithoutSlash) });
							res.end();
							return;
						}
					}
					// Redirect /foo to /foo/ if /foo/index.html exists
					else {
						const htmlPath = fileURLToPath(outDir + pathname + '/index.html');
						if (fs.existsSync(htmlPath)) {
							res.writeHead(308, { Location: joinPaths(base, pathname + '/') });
							res.end();
							return;
						}
					}

					next();
				});
			};
		},
	};
}
