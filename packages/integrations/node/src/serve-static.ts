import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import url from 'node:url';
import { hasFileExtension, isInternalPath } from '@astrojs/internal-helpers/path';
import type { MiddlewareHandler } from 'astro';
import { NodeApp } from 'astro/app/node';
import { createContext } from 'astro/middleware';
import send from 'send';
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
	 */
	return async (req: IncomingMessage, res: ServerResponse, ssr: () => unknown) => {
		if (req.url) {
			const [urlPath, urlQuery] = req.url.split('?');
			const filePath = path.join(client, app.removeBase(urlPath));

			// Check if middleware should run for this request
			if (options.runMiddlewareOnRequest && isPrerenderedHTMLPage(urlPath)) {
				try {
					// Get middleware from the app's manifest
					// The middleware is already bundled with the app (not edge middleware)
					// @ts-expect-error - accessing protected manifest property
					const manifest = app.manifest;
					if (manifest.middleware) {
						const middlewareModule =
							typeof manifest.middleware === 'function'
								? await manifest.middleware()
								: manifest.middleware;

						if (middlewareModule?.onRequest) {
							const handled = await executeMiddlewareForStatic(
								req,
								res,
								middlewareModule.onRequest,
								app,
							);

							if (handled) {
								return; // Middleware handled the response
							}
						}
					}
					// Otherwise, fall through to static file serving
				} catch (err) {
					// Log error but fall through to static serving
					const logger = app.getAdapterLogger();
					logger.error(`Error executing middleware for static page: ${err}`);
				}
			}

			let isDirectory = false;
			try {
				isDirectory = fs.lstatSync(filePath).isDirectory();
			} catch {}

			const { trailingSlash = 'ignore' } = options;

			const hasSlash = urlPath.endsWith('/');
			let pathname = urlPath;

			if (app.headersMap && app.headersMap.length > 0) {
				const routeData = app.match(req, true);
				if (routeData && routeData.prerender) {
					const matchedRoute = app.headersMap.find((header) => header.pathname.includes(pathname));
					if (matchedRoute) {
						for (const header of matchedRoute.headers) {
							res.setHeader(header.key, header.value);
						}
					}
				}
			}

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
		} else {
			ssr();
		}
	};
}

function resolveClientDir(options: Options) {
	const clientURLRaw = new URL(options.client);
	const serverURLRaw = new URL(options.server);
	const rel = path.relative(url.fileURLToPath(serverURLRaw), url.fileURLToPath(clientURLRaw));

	// walk up the parent folders until you find the one that is the root of the server entry folder. This is how we find the client folder relatively.
	const serverFolder = path.basename(options.server);
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

/**
 * Check if a URL path is for a prerendered HTML page (not an asset)
 */
function isPrerenderedHTMLPage(urlPath: string): boolean {
	// Skip middleware for asset files
	if (
		urlPath.startsWith('/_astro/') ||
		/\.(?:css|js|json|xml|txt|ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|webp|avif|map)$/i.test(
			urlPath,
		)
	) {
		return false;
	}

	// Middleware should run for HTML pages (anything else)
	return true;
}

/**
 * Execute middleware before serving a static file.
 * Returns true if middleware handled the response (returned a Response without calling next()).
 * Returns false if middleware called next() - the static file should be served normally.
 */
async function executeMiddlewareForStatic(
	req: IncomingMessage,
	res: ServerResponse,
	middleware: MiddlewareHandler,
	app: NodeApp,
): Promise<boolean> {
	// Create a proper Request object with all headers/cookies
	const request = NodeApp.createRequest(req, {
		allowedDomains: app.getAllowedDomains?.() ?? [],
	});

	// Create middleware context
	const ctx = createContext({
		request,
		params: {}, // Static pages don't have dynamic params
		locals: {},
		defaultLocale: '',
	});

	// Mark this as a prerendered page so middleware knows
	ctx.isPrerendered = true;

	let nextCalled = false;

	// Create a next function - if called, we'll serve the static file normally
	const middlewareNext = async (): Promise<Response> => {
		nextCalled = true;
		// Return a dummy response - the static file will be served after middleware returns
		return new Response(null);
	};

	// Execute middleware
	const response = await middleware(ctx, middlewareNext);

	// If middleware returned a response and didn't call next(), use it
	if (response && !nextCalled) {
		await NodeApp.writeResponse(response, res);
		return true; // Middleware handled the response
	}

	// Middleware called next() - continue with static file serving
	return false;
}



