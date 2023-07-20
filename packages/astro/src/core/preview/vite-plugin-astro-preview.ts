import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import type { AstroSettings } from '../../@types/astro.js';
import { notFoundTemplate, subpathNotUsedTemplate } from '../../template/4xx.js';
import { stripBase } from './util.js';

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

				const pathname = stripBase(req.url!, base);
				const isRoot = pathname === '/';

				// Validate trailingSlash
				if (!isRoot) {
					const hasTrailingSlash = pathname.endsWith('/');

					if (hasTrailingSlash && trailingSlash == 'never') {
						res.statusCode = 404;
						res.end(notFoundTemplate(pathname, 'Not Found (trailingSlash is set to "never")'));
						return;
					}

					if (
						!hasTrailingSlash &&
						trailingSlash == 'always' &&
						!HAS_FILE_EXTENSION_REGEXP.test(pathname)
					) {
						res.statusCode = 404;
						res.end(notFoundTemplate(pathname, 'Not Found (trailingSlash is set to "always")'));
						return;
					}
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
						const pathname = stripBase(req.url!, base);
						res.statusCode = 404;
						res.end(notFoundTemplate(pathname, 'Not Found'));
					}
				});
			};
		},
	};
}
