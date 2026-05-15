import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { notFoundTemplate, subpathNotUsedTemplate } from '../../template/4xx.js';
import { cleanUrl } from '../../vite-plugin-utils/index.js';
import { stripBase } from './util.js';
const HAS_FILE_EXTENSION_REGEXP = /\.[^/]+$/;
function vitePluginAstroPreview(settings) {
	const { base, outDir, trailingSlash } = settings.config;
	function handle404(req, res) {
		const errorPagePath = fileURLToPath(outDir + '/404.html');
		if (fs.existsSync(errorPagePath)) {
			res.statusCode = 404;
			res.setHeader('Content-Type', 'text/html');
			res.end(fs.readFileSync(errorPagePath));
		} else {
			res.statusCode = 404;
			res.end(notFoundTemplate(req.url, 'Not Found'));
		}
	}
	return {
		name: 'astro:preview',
		apply: 'serve',
		configurePreviewServer(server) {
			server.middlewares.use((req, res, next) => {
				if (!req.url.startsWith(base)) {
					res.statusCode = 404;
					res.end(subpathNotUsedTemplate(base, req.url));
					return;
				}
				const pathname = cleanUrl(stripBase(req.url, base));
				const isRoot = pathname === '/';
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
				for (const middleware of server.middlewares.stack) {
					if (middleware.handle.name === 'vite404Middleware') {
						middleware.handle = handle404;
					}
				}
				next();
			});
			return () => {
				server.middlewares.use((req, _res, next) => {
					const pathname = cleanUrl(req.url);
					if (pathname.endsWith('/')) {
						const pathnameWithoutSlash = pathname.slice(0, -1);
						const htmlPath = fileURLToPath(outDir + pathnameWithoutSlash + '.html');
						if (fs.existsSync(htmlPath)) {
							req.url = pathnameWithoutSlash + '.html';
							return next();
						}
					} else {
						const htmlPath = fileURLToPath(outDir + pathname + '/index.html');
						if (fs.existsSync(htmlPath)) {
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
export { vitePluginAstroPreview };
