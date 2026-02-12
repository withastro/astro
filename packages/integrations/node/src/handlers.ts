import { NodeApp } from 'astro/app/node';
import type * as http from 'node:http';
import type { Config } from './vite-plugin-config.js';
import type { RequestHandler } from './types.js';
import { AsyncLocalStorage } from 'node:async_hooks';
import * as path from 'node:path';
import * as fs from 'node:fs';
import {
	hasFileExtension,
	isInternalPath,
	prependForwardSlash,
} from '@astrojs/internal-helpers/path';
import send from 'send';
import { Readable } from 'node:stream';
import { resolveClientDir } from './shared.js';

/**
 * Read a prerendered error page from disk and return it as a Response.
 * Returns undefined if the file doesn't exist or can't be read.
 */
async function readErrorPageFromDisk(
	client: string,
	status: number,
): Promise<Response | undefined> {
	// Try both /404.html and /404/index.html patterns
	const filePaths = [`${status}.html`, `${status}/index.html`];

	for (const filePath of filePaths) {
		const fullPath = path.join(client, filePath);
		try {
			const stream = fs.createReadStream(fullPath);
			// Wait for the stream to open successfully or error
			await new Promise<void>((resolve, reject) => {
				stream.once('open', () => resolve());
				stream.once('error', reject);
			});
			const webStream = Readable.toWeb(stream) as ReadableStream;
			return new Response(webStream, {
				headers: { 'Content-Type': 'text/html; charset=utf-8' },
			});
		} catch {
			// File doesn't exist or can't be read, try next pattern
		}
	}

	return undefined;
}

/**
 * Creates a Node.js http listener for on-demand rendered pages, compatible with http.createServer and Connect middleware.
 * If the next callback is provided, it will be called if the request does not have a matching route.
 * Intended to be used in both standalone and middleware mode.
 */
export function createAppHandler({
	app,
	experimentalErrorPageHost,
	...options
}: Pick<Config, 'experimentalErrorPageHost' | 'server' | 'client'> & {
	app: NodeApp;
}): RequestHandler {
	/**
	 * Keep track of the current request path using AsyncLocalStorage.
	 * Used to log unhandled rejections with a helpful message.
	 */
	const als = new AsyncLocalStorage<string>();
	const logger = app.getAdapterLogger();
	process.on('unhandledRejection', (reason) => {
		const requestUrl = als.getStore();
		logger.error(`Unhandled rejection while rendering ${requestUrl}`);
		console.error(reason);
	});

	const client = resolveClientDir(options);

	// Read prerendered error pages directly from disk instead of fetching over HTTP.
	// This avoids SSRF risks and is more efficient.
	const prerenderedErrorPageFetch = async (url: string): Promise<Response> => {
		if (url.includes('/404')) {
			const response = await readErrorPageFromDisk(client, 404);
			if (response) return response;
		}
		if (url.includes('/500')) {
			const response = await readErrorPageFromDisk(client, 500);
			if (response) return response;
		}
		// Fallback: if experimentalErrorPageHost is configured, fetch from there
		if (experimentalErrorPageHost) {
			const originUrl = new URL(experimentalErrorPageHost);
			const errorPageUrl = new URL(url);
			errorPageUrl.protocol = originUrl.protocol;
			errorPageUrl.host = originUrl.host;
			return fetch(errorPageUrl);
		}
		// No file found and no fallback configured - return empty response
		return new Response(null, { status: 404 });
	};

	return async (req, res, next, locals) => {
		let request: Request;
		try {
			request = NodeApp.createRequest(req, {
				allowedDomains: app.getAllowedDomains?.() ?? [],
			});
		} catch (err) {
			logger.error(`Could not render ${req.url}`);
			console.error(err);
			res.statusCode = 500;
			res.end('Internal Server Error');
			return;
		}

		// Redirects are considered prerendered routes in static mode, but we want to
		// handle them dynamically, so prerendered routes are included here.
		const routeData = app.match(request, true);
		// But we still want to skip prerendered pages.
		if (routeData && !(routeData.type === 'page' && routeData.prerender)) {
			const response = await als.run(request.url, () =>
				app.render(request, {
					addCookieHeader: true,
					locals,
					routeData,
					prerenderedErrorPageFetch,
				}),
			);
			await NodeApp.writeResponse(response, res);
		} else if (next) {
			return next();
		} else {
			const response = await app.render(req, { addCookieHeader: true, prerenderedErrorPageFetch });
			await NodeApp.writeResponse(response, res);
		}
	};
}

/**
 * Creates a Node.js http listener for static files and prerendered pages.
 * In standalone mode, the static handler is queried first for the static files.
 * If one matching the request path is not found, it relegates to the SSR handler.
 * Intended to be used only in the standalone mode.
 */
export function createStaticHandler({
	app,
	trailingSlash,
	assets,
	...rest
}: Pick<Config, 'trailingSlash' | 'assets' | 'server' | 'client'> & { app: NodeApp }) {
	const client = resolveClientDir(rest);
	/**
	 * @param ssr The SSR handler to be called if the static handler does not find a matching file.
	 */
	return (req: http.IncomingMessage, res: http.ServerResponse, ssr: () => unknown) => {
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
			stream.on('headers', (_res: http.ServerResponse) => {
				// assets in dist/_astro are hashed and should get the immutable header
				if (pathname.startsWith(`/${assets}/`)) {
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

export function createStandaloneHandler({
	app,
	experimentalErrorPageHost,
	assets,
	client,
	server,
	trailingSlash,
}: Parameters<typeof createAppHandler>[0] &
	Parameters<typeof createStaticHandler>[0]): RequestHandler {
	const appHandler = createAppHandler({ app, experimentalErrorPageHost, client, server });
	const staticHandler = createStaticHandler({ app, assets, client, server, trailingSlash });
	return (req, res, next, locals) => {
		try {
			// validate request path
			decodeURI(req.url!);
		} catch {
			res.writeHead(400);
			res.end('Bad request.');
			return;
		}
		staticHandler(req, res, () => appHandler(req, res, next, locals));
	};
}
