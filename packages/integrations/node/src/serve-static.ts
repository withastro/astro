import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import url from 'node:url';
import { hasFileExtension, isInternalPath } from '@astrojs/internal-helpers/path';
import { NodeApp } from 'astro/app/node';
import send from 'send';
import { shouldRunMiddleware } from './serve-middleware.js';
import {
	createRequestSafely,
	handleRequestCreationError,
	send500Response,
	setRouteHeaders,
	tryServe500ErrorPage,
} from './serve-utils.js';
import type { Options } from './types.js';

/**
 * Creates a Node.js http listener for static files and prerendered pages.
 * In standalone mode, the static handler is queried first for the static files.
 * If one matching the request path is not found, it relegates to the SSR handler.
 * Intended to be used only in the standalone mode.
 */
export function createStaticHandler(app: NodeApp, options: Options) {
	const client = resolveClientDir(options);

	/**
	 * @param ssr The SSR handler to be called if the static handler does not find a matching file.
	 * @param locals Optional locals object that will be passed to middleware.
	 */
	return async (
		req: IncomingMessage,
		res: ServerResponse,
		ssr: () => unknown,
		locals?: object,
	) => {
		if (!req.url) {
			return ssr();
		}

		const [urlPath, urlQuery] = req.url.split('?');

		// 1. Create Request object safely (early)
		const { request, error: requestError } = createRequestSafely(req, app);
		if (!request) {
			handleRequestCreationError(req, res, requestError, app);
			return;
		}

		// 2. Match route once
		const routeData = app.match(request, true);

		// 3. Check if middleware should run for this request
		if (shouldRunMiddleware(urlPath, routeData, options.runMiddlewareOnRequest ?? false)) {
			try {
				// Get middleware (already cached by the pipeline)
				const middleware = await app.getAllMiddleware();

				// Execute middleware using the core method
				const result = await app.executeMiddleware(
					request,
					routeData,
					middleware,
					locals,
				);

				if (result.handled && result.response) {
					// Middleware handled the response completely (didn't call next())
					// Set route headers and write the middleware's response
					setRouteHeaders(res, app, routeData, urlPath);
					await NodeApp.writeResponse(result.response, res);
					return;
				} else if (result.response) {
					// Middleware called next() but may have set headers
					// Apply middleware headers to the response before serving static file
					for (const [key, value] of result.response.headers.entries()) {
						res.setHeader(key, value);
					}
				}
				// Otherwise, fall through to static file serving
			} catch (err) {
				const error = err instanceof Error ? err : new Error(String(err));

				// Try to serve prerendered 500 error page
				if (tryServe500ErrorPage(req, res, client, app, error)) {
					return;
				}

				// No error page available, return generic 500
				send500Response(req, res, error, app);
				return;
			}
		}

		// 4. Set headers for static file serving (if not already handled by middleware)
		setRouteHeaders(res, app, routeData, urlPath);

		// 5. Handle trailing slash and directory logic
		const filePath = path.join(client, app.removeBase(urlPath));
		let isDirectory = false;
		try {
			isDirectory = fs.lstatSync(filePath).isDirectory();
		} catch {}

		const { trailingSlash = 'ignore' } = options;
		const hasSlash = urlPath.endsWith('/');
		let pathname = urlPath;

		switch (trailingSlash) {
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

		// 6. Serve the static file
		// app.removeBase sometimes returns a path without a leading slash
		pathname = prependForwardSlash(app.removeBase(pathname));

		const stream = send(req, pathname, {
			root: client,
			dotfiles: pathname.startsWith('/.well-known/') ? 'allow' : 'deny',
		});

		let forwardError = false;

		stream.on('error', (err) => {
			if (forwardError) {
				const logger = app.getAdapterLogger();
				logger.error(`Could not serve static file ${req.url}`);
				console.error(err);
				res.statusCode = 500;
				res.end('Internal Server Error');
				return;
			}
			// File not found
			// For asset files (when runMiddlewareOnRequest is enabled), return 404 directly
			// instead of forwarding to SSR to avoid running middleware on missing assets
			if (options.runMiddlewareOnRequest && !shouldRunMiddleware(urlPath, routeData, true)) {
				res.statusCode = 404;
				res.end('Not Found');
				return;
			}
			// Forward to the SSR handler for HTML pages
			ssr();
		});
		stream.on('headers', (_res: ServerResponse) => {
			// assets in dist/_astro are hashed and should get the immutable header
			if (pathname.startsWith(`/${options.assets}/`)) {
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
	};
}

function resolveClientDir(options: Options) {
	const clientURLRaw = new URL(options.client);
	const serverURLRaw = new URL(options.server);
	const rel = path.relative(url.fileURLToPath(serverURLRaw), url.fileURLToPath(clientURLRaw));

	// walk up the parent folders until you find the one that is the root of the server entry folder. This is how we find the client folder relatively.
	// Convert server to string/path in case it's a URL object
	const serverPath = typeof options.server === 'string' ? options.server : url.fileURLToPath(serverURLRaw);
	const serverFolder = path.basename(serverPath);
	let serverEntryFolderURL = path.dirname(import.meta.url);
	while (!serverEntryFolderURL.endsWith(serverFolder)) {
		serverEntryFolderURL = path.dirname(serverEntryFolderURL);
	}
	const serverEntryURL = serverEntryFolderURL + '/entry.mjs';
	const clientURL = new URL(appendForwardSlash(rel), serverEntryURL);
	const client = url.fileURLToPath(clientURL);
	return client;
}

function prependForwardSlash(pth: string) {
	return pth.startsWith('/') ? pth : '/' + pth;
}

function appendForwardSlash(pth: string) {
	return pth.endsWith('/') ? pth : pth + '/';
}



