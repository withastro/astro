import { AsyncLocalStorage } from 'node:async_hooks';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import {
	createRequestFromNodeRequest,
	writeResponse,
	getAbortControllerCleanup,
} from 'astro/app/node';
import type { BaseApp } from 'astro/app';
import { resolveClientDir } from './shared.js';
import type { Options, RequestHandler } from './types.js';

// Share one process listener across handlers while keeping request context isolated.
// The WeakSet matches only the exact errors emitted by aborted requests.
const requestContext = new AsyncLocalStorage<{ app: BaseApp; url: string }>();
const abortedRequestErrors = new WeakSet<Error>();

process.on('unhandledRejection', (reason) => {
	if (reason instanceof Error && abortedRequestErrors.has(reason)) return;
	const context = requestContext.getStore();
	if (!context) {
		console.error(reason);
		return;
	}
	const error = reason instanceof Error ? reason.stack || reason.message : String(reason);
	context.app.adapterLogger.error(`Unhandled rejection while rendering ${context.url}\n${error}`);
});

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
		// Declare stream outside try so it's accessible in catch for cleanup.
		let stream: ReturnType<typeof createReadStream> | undefined;
		try {
			stream = createReadStream(fullPath);
			// Wait for the stream to open successfully or error
			await new Promise<void>((resolve, reject) => {
				stream!.once('open', () => resolve());
				stream!.once('error', reject);
			});
			const webStream = Readable.toWeb(stream) as ReadableStream;
			return new Response(webStream, {
				headers: { 'Content-Type': 'text/html; charset=utf-8' },
			});
		} catch {
			// File doesn't exist or can't be read, try next pattern.
			// Destroy the stream to release the file descriptor if it was
			// partially opened before the error fired.
			stream?.destroy();
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
	const logger = app.adapterLogger;

	const client = resolveClientDir(options);

	// Read prerendered error pages directly from disk instead of fetching over HTTP.
	// This avoids SSRF risks and is more efficient.
	const prerenderedErrorPageFetch = async (url: string): Promise<Response> => {
		const { pathname } = new URL(url);
		if (pathname.endsWith('/404.html') || pathname.endsWith('/404/index.html')) {
			const response = await readErrorPageFromDisk(client, 404);
			if (response) return response;
		}
		if (pathname.endsWith('/500.html') || pathname.endsWith('/500/index.html')) {
			const response = await readErrorPageFromDisk(client, 500);
			if (response) return response;
		}
		// No file found and no fallback configured - return empty response
		return new Response(null, { status: 404 });
	};

	// Use the configured body size limit. A value of 0 or Infinity disables the limit.
	const effectiveBodySizeLimit =
		options.bodySizeLimit === 0 || options.bodySizeLimit === Number.POSITIVE_INFINITY
			? undefined
			: options.bodySizeLimit;

	return async (req, res, next, locals) => {
		req.once('error', (error: NodeJS.ErrnoException) => {
			if (error.code === 'ECONNRESET') abortedRequestErrors.add(error);
		});
		let request: Request;
		try {
			request = createRequestFromNodeRequest(req, {
				allowedDomains: app.getAllowedDomains?.() ?? [],
				bodySizeLimit: effectiveBodySizeLimit,
				port: options.port,
			});
		} catch (err) {
			logger.error(`Could not render ${req.url}`);
			console.error(err);
			res.statusCode = 500;
			res.end('Internal Server Error');
			return;
		}
		const context = { app, url: request.url };

		// Redirects are considered prerendered routes in static mode, but we want to
		// handle them dynamically, so prerendered routes are included here.
		const routeData = app.match(request, true);
		// But we still want to skip prerendered pages.
		if (routeData && !(routeData.type === 'page' && routeData.prerender)) {
			await requestContext.run(context, async () => {
				const response = await app.render(request, {
					addCookieHeader: true,
					locals,
					routeData,
					prerenderedErrorPageFetch,
				});
				await writeResponse(response, res);
			});
		} else if (next) {
			// Since we're not calling `writeResponse()`, clean up the AbortController and socket listeners
			const cleanup = getAbortControllerCleanup(req);
			if (cleanup) cleanup();
			return next();
		} else {
			await requestContext.run(context, async () => {
				const response = await app.render(request, {
					addCookieHeader: true,
					prerenderedErrorPageFetch,
				});
				await writeResponse(response, res);
			});
		}
	};
}
