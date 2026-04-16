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
 * Resolves a URL path to a filesystem path within the client directory,
 * and checks whether it is a directory.
 *
 * Returns `isDirectory: false` if the resolved path escapes the client root
 * (e.g. via `..` path traversal segments).
 */
export function resolveStaticPath(client: string, urlPath: string) {
	const filePath = path.join(client, urlPath);
	const resolved = path.resolve(filePath);
	const resolvedClient = path.resolve(client);

	// Prevent path traversal: if the resolved path is outside the client
	// directory, treat it as non-existent rather than probing the filesystem.
	if (resolved !== resolvedClient && !resolved.startsWith(resolvedClient + path.sep)) {
		return { filePath: resolved, isDirectory: false };
	}

	let isDirectory = false;
	try {
		isDirectory = fs.lstatSync(filePath).isDirectory();
	} catch {}

	return { filePath: resolved, isDirectory };
}

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
			const { isDirectory } = resolveStaticPath(client, app.removeBase(urlPath));

			const hasSlash = urlPath.endsWith('/');
			let pathname = urlPath;

			if (headersMap && headersMap.length > 0) {
				const request = createRequest(req, {
					allowedDomains: app.getAllowedDomains?.() ?? [],
					port: options.port,
				});
				const routeData = app.match(request, true);
				if (routeData && routeData.prerender) {
					// Headers are stored keyed by base-less route paths (e.g. "/one"), so we
					// must strip config.base from the incoming URL before matching, just as
					// we do for filesystem access above.
					const baselessPathname = prependForwardSlash(app.removeBase(urlPath));
					const matchedRoute = headersMap.find((header) =>
						header.pathname.includes(baselessPathname),
					);
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

			const normalizedPathname = path.posix.normalize(pathname);
			const stream = send(req, normalizedPathname, {
				root: client,
				dotfiles: normalizedPathname.startsWith('/.well-known/') ? 'allow' : 'deny',
			});

			let forwardError = false;

			stream.on('error', (err) => {
				if (forwardError) {
					// The `send` library emits errors with a `statusCode` property
					// (e.g. 412 for precondition failures from If-Match / If-Unmodified-Since).
					// Use the real status when available instead of always returning 500.
					const status = 'statusCode' in err ? (err as any).statusCode : 500;
					if (status >= 500) {
						console.error(err.toString());
					}
					res.writeHead(status);
					res.end(status >= 500 ? 'Internal server error' : '');
					return;
				}
				// File not found, forward to the SSR handler
				ssr();
			});
			stream.on('file', () => {
				forwardError = true;
			});
			// The `stream` event fires only when `send` is actually going to stream
			// the file content (i.e. after all precondition checks like If-Match and
			// If-Unmodified-Since have passed). Setting cache headers here instead of
			// in the `headers` event ensures error responses (e.g. 412) are never
			// sent with immutable cache headers, which would poison CDN caches.
			stream.on('stream', () => {
				if (normalizedPathname.startsWith(`/${app.manifest.assetsDir}/`)) {
					res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
				}
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
