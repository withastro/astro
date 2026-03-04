import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { hasFileExtension, isInternalPath } from '@astrojs/internal-helpers/path';
import type { BaseApp } from 'astro/app';
import send from 'send';
import { resolveClientDir } from './shared.js';
import type { NodeAppHeadersJson, Options } from './types.js';
import { createRequest } from 'astro/app/node';

/**
 * Creates a Node.js http listener for static files and prerendered pages.
 * In standalone mode, the static handler is queried first for the static files.
 * If one matching the request path is not found, it relegates to the SSR handler.
 * Intended to be used only in the standalone mode.
 */
export function createStaticHandler(
	app: BaseApp,
	options: Options,
	headersMap: NodeAppHeadersJson | undefined,
) {
	const client = resolveClientDir(options);
	/**
	 * @param ssr The SSR handler to be called if the static handler does not find a matching file.
	 */
	return (req: IncomingMessage, res: ServerResponse, ssr: () => unknown) => {
		if (req.url) {
			// There might be cases where the incoming URL has the #, which we want to remove.
			let fullUrl = req.url;
			if (req.url.includes('#')) {
				fullUrl = fullUrl.slice(0, req.url.indexOf('#'));
			}

			const [urlPath, urlQuery] = fullUrl.split('?');
			const filePath = path.join(client, app.removeBase(urlPath));

			let isDirectory = false;
			try {
				isDirectory = fs.lstatSync(filePath).isDirectory();
			} catch {}

			const hasSlash = urlPath.endsWith('/');
			let pathname = urlPath;

			if (headersMap && headersMap.length > 0) {
				const request = createRequest(req, {
					allowedDomains: app.getAllowedDomains?.() ?? [],
				});
				const routeData = app.match(request, true);
				if (routeData && routeData.prerender) {
					const matchedRoute = headersMap.find((header) => header.pathname.includes(pathname));
					if (matchedRoute) {
						for (const header of matchedRoute.headers) {
							res.setHeader(header.key, header.value);
						}
					}
				}
			}

			switch (app.manifest.trailingSlash) {
				case 'never': {
					if (isDirectory && urlPath !== '/' && hasSlash) {
						pathname = urlPath.slice(0, -1) + (urlQuery ? '?' + urlQuery : '');
						res.statusCode = 301;
						res.setHeader('Location', pathname);
						return res.end();
					}
					if (isDirectory && !hasSlash) {
						pathname = `${urlPath}/index.html`;
					}
					break;
				}
				case 'ignore': {
					if (isDirectory && !hasSlash) {
						pathname = `${urlPath}/index.html`;
					}
					break;
				}
				case 'always': {
					// trailing slash is not added to "subresources"
					// We check if `urlPath` doesn't contain possible internal paths. This should prevent
					// redirects to unwanted paths
					if (!hasSlash && !hasFileExtension(urlPath) && !isInternalPath(urlPath)) {
						pathname = urlPath + '/' + (urlQuery ? '?' + urlQuery : '');
						res.statusCode = 301;
						res.setHeader('Location', pathname);
						return res.end();
					}
					break;
				}
			}
			// app.removeBase sometimes returns a path without a leading slash
			pathname = prependForwardSlash(app.removeBase(pathname));

			const stream = send(req, pathname, {
				root: client,
				dotfiles: pathname.startsWith('/.well-known/') ? 'allow' : 'deny',
			});

			let forwardError = false;

			stream.on('error', (err) => {
				if (forwardError) {
					console.error(err.toString());
					res.writeHead(500);
					res.end('Internal server error');
					return;
				}
				// File not found, forward to the SSR handler
				ssr();
			});
			stream.on('headers', (_res: ServerResponse) => {
				// assets in dist/_astro are hashed and should get the immutable header
				if (pathname.startsWith(`/${app.manifest.assetsDir}/`)) {
					// This is the "far future" cache header, used for static files whose name includes their digest hash.
					// 1 year (31,536,000 seconds) is convention.
					// Taken from https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#immutable
					_res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
				}
			});
			stream.on('file', () => {
				forwardError = true;
			});
			stream.pipe(res);
		} else {
			ssr();
		}
	};
}

function prependForwardSlash(pth: string) {
	return pth.startsWith('/') ? pth : '/' + pth;
}
