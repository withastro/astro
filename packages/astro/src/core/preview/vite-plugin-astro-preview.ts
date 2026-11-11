import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import type { Connect, Plugin } from 'vite';
import { notFoundTemplate, subpathNotUsedTemplate } from '../../template/4xx.js';
import type { AstroSettings } from '../../types/astro.js';
import { cleanUrl } from '../../vite-plugin-utils/index.js';
import { stripBase } from './util.js';

const HAS_FILE_EXTENSION_REGEXP = /\.[^/]+$/;

export function vitePluginAstroPreview(settings: AstroSettings): Plugin {
	const { base, outDir, trailingSlash } = settings.config;

	function handle404(req: IncomingMessage, res: ServerResponse) {
		const errorPagePath = fileURLToPath(outDir + '/404.html');
		if (fs.existsSync(errorPagePath)) {
			res.statusCode = 404;
			res.setHeader('Content-Type', 'text/html');
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

				const pathname = cleanUrl(stripBase(req.url!, base));
				const isRoot = pathname === '/';

				// Validate trailingSlash
				if (!isRoot) {
					const hasTrailingSlash = pathname.endsWith('/');

					if (hasTrailingSlash && trailingSlash === 'never') {
						res.statusCode = 404;
						res.end(notFoundTemplate(pathname, 'Not Found (trailingSlash is set to "never")'));
						return;
					}

					if (
						!hasTrailingSlash &&
						trailingSlash === 'always' &&
						!HAS_FILE_EXTENSION_REGEXP.test(pathname)
					) {
						res.statusCode = 404;
						res.end(notFoundTemplate(pathname, 'Not Found (trailingSlash is set to "always")'));
						return;
					}
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

					// Malformed percent-encoding is a client error, not a 500. (#18650)
					try {
						decodeURI(pathname);
					} catch {
						res.statusCode = 400;
						res.end('Bad Request');
						return;
					}

					// Vite doesn't handle /foo/ if /foo.html exists, we handle it anyways
					if (pathname.endsWith('/')) {
						const pathnameWithoutSlash = pathname.slice(0, -1);
						const htmlPath = toFilePath(outDir + pathnameWithoutSlash + '.html');
						if (htmlPath && fs.existsSync(htmlPath)) {
							req.url = pathnameWithoutSlash + '.html';
							return next();
						}
					}
					// Vite doesn't handle /foo if /foo/index.html exists, we handle it anyways
					else {
						const htmlPath = toFilePath(outDir + pathname + '/index.html');
						if (htmlPath && fs.existsSync(htmlPath)) {
							req.url = pathname + '/index.html';
							return next();
						}
					}

					next();
				});
			};
		},
	};
}

/**
 * Like `fileURLToPath`, but returns `undefined` for valid URLs that can't map to a
 * file, such as an encoded `/` (`%2F`), so they fall through to a 404.
 */
function toFilePath(url: string): string | undefined {
	try {
		return fileURLToPath(url);
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === 'ERR_INVALID_FILE_URL_PATH') return undefined;
		throw err;
	}
}
