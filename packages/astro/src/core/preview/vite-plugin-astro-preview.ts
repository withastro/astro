import fs from 'fs';
import { fileURLToPath } from 'url';
import { Plugin } from 'vite';
import { AstroSettings } from '../../@types/astro.js';
import { notFoundTemplate, subpathNotUsedTemplate } from '../../template/4xx.js';

const HAS_FILE_EXTENSION_REGEXP = /^.*\.[^\\]+$/;

export function vitePluginAstroPreview(settings: AstroSettings): Plugin {
	const { base, outDir, trailingSlash } = settings.config;
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

				/** Relative request path. */
				const pathname = req.url!.slice(base.length - 1);
				const isRoot = pathname === '/';
				const hasTrailingSlash = isRoot || pathname.endsWith('/');

				function sendError(message: string) {
					res.statusCode = 404;
					res.end(notFoundTemplate(pathname, message));
				}

				switch (true) {
					case hasTrailingSlash && trailingSlash == 'never' && !isRoot:
						sendError('Not Found (trailingSlash is set to "never")');
						return;
					case !hasTrailingSlash &&
						trailingSlash == 'always' &&
						!isRoot &&
						!HAS_FILE_EXTENSION_REGEXP.test(pathname):
						sendError('Not Found (trailingSlash is set to "always")');
						return;
				}
				next();
			});

			return () => {
				server.middlewares.use((req, res) => {
					const errorPagePath = fileURLToPath(outDir + '/404.html');
					if (fs.existsSync(errorPagePath)) {
						res.statusCode = 404;
						res.setHeader('Content-Type', 'text/html;charset=utf-8');
						res.end(fs.readFileSync(errorPagePath));
					} else {
						res.statusCode = 404;
						res.end(notFoundTemplate(req.originalUrl!, 'Not Found'));
					}
				});
			};
		},
	};
}
