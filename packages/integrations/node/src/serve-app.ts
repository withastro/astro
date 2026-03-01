import { AsyncLocalStorage } from 'node:async_hooks';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { createRequest, writeResponse } from 'astro/app/node';
import type { BaseApp } from 'astro/app';
import { resolveClientDir } from './shared.js';
import type { Options, RequestHandler } from './types.js';

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
			const stream = createReadStream(fullPath);
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
export function createAppHandler(app: BaseApp, options: Options): RequestHandler {
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
		if (options.experimentalErrorPageHost) {
			const originUrl = new URL(options.experimentalErrorPageHost);
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
			request = createRequest(req, {
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
			await writeResponse(response, res);
		} else if (next) {
			return next();
		} else {
			const response = await app.render(request, {
				addCookieHeader: true,
				prerenderedErrorPageFetch,
			});
			await writeResponse(response, res);
		}
	};
}
