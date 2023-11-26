import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Connect, Plugin } from 'vite';
import { version } from 'vite';
import type { AstroSettings } from '../../@types/astro.js';
import { notFoundTemplate, subpathNotUsedTemplate } from '../../template/4xx.js';
import { stripBase } from './util.js';

const HAS_FILE_EXTENSION_REGEXP = /^.*\.[^\\]+$/;
const IS_VITE_5 = version.startsWith('5.');

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

				const strippedPathname = stripBase(req.url!, base);
				const pathname = new URL(strippedPathname, 'https://a.b').pathname;
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
				const fourOhFourMiddleware: Connect.NextHandleFunction = (req, res) => {
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
				};

				// Vite 5 has its own 404 middleware, we replace it with ours instead.
				if (IS_VITE_5) {
					for (const middleware of server.middlewares.stack) {
						// This hardcoded name will not break between Vite versions
						if ((middleware.handle as Connect.HandleFunction).name === 'vite404Middleware') {
							middleware.handle = fourOhFourMiddleware;
						}
					}
				} else {
					server.middlewares.use(fourOhFourMiddleware);
				}
			};
		},
	};
}
