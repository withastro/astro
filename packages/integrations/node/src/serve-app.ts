import { AsyncLocalStorage } from 'node:async_hooks';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import {
	createRequest,
	writeResponse,
	getAbortControllerCleanup,
	getStaticAssetPath,
} from 'astro/app/node';
import type { BaseApp } from 'astro/app';
import type { RouteData } from 'astro';
import { resolveClientDir } from './shared.js';
import type { Options, RequestHandler } from './types.js';

/**
 * Read a prerendered page from disk by output path and return it as a Response.
 * Returns undefined if the file doesn't exist or can't be read.
 */
async function readPageFromDisk(client: string, staticAssetPath: string): Promise<Response | undefined> {
	let stream: ReturnType<typeof createReadStream> | undefined;
	try {
		stream = createReadStream(path.join(client, staticAssetPath));
		await new Promise<void>((resolve, reject) => {
			stream!.once('open', () => resolve());
			stream!.once('error', reject);
		});
		const webStream = Readable.toWeb(stream) as ReadableStream;
		return new Response(webStream, {
			headers: { 'Content-Type': 'text/html; charset=utf-8' },
		});
	} catch {
		stream?.destroy();
		return undefined;
	}
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
		const { pathname } = new URL(url);
		if (pathname.endsWith('/404.html') || pathname.endsWith('/404/index.html')) {
			const response = await readPageFromDisk(
				client,
				getStaticAssetPath('/404', {
					base: app.manifest.base,
					buildFormat: app.manifest.buildFormat,
				}),
			);
			if (response) return response;
		}
		if (pathname.endsWith('/500.html') || pathname.endsWith('/500/index.html')) {
			const response = await readPageFromDisk(
				client,
				getStaticAssetPath('/500', {
					base: app.manifest.base,
					buildFormat: app.manifest.buildFormat,
				}),
			);
			if (response) return response;
		}
		// No file found and no fallback configured - return empty response
		return new Response(null, { status: 404 });
	};

	const getStaticAsset = async (_routeData: RouteData, pathname: string): Promise<Response | undefined> => {
		const staticAssetPath = getStaticAssetPath(pathname, {
			base: app.manifest.base,
			buildFormat: app.manifest.buildFormat,
		});
		return readPageFromDisk(client, staticAssetPath);
	};

	const shouldServePrerenderedThroughMiddleware =
		app.manifest.middlewareMode === 'always' || app.manifest.middlewareMode === 'on-request';

	// Use the configured body size limit. A value of 0 or Infinity disables the limit.
	const effectiveBodySizeLimit =
		options.bodySizeLimit === 0 || options.bodySizeLimit === Number.POSITIVE_INFINITY
			? undefined
			: options.bodySizeLimit;

	return async (req, res, next, locals) => {
		let request: Request;
		try {
			request = createRequest(req, {
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

		// Redirects are considered prerendered routes in static mode, but we want to
		// handle them dynamically, so prerendered routes are included here.
		const routeData = app.match(request, true);
		if (routeData) {
			const response = await als.run(request.url, () =>
				app.render(request, {
					addCookieHeader: true,
					locals,
					routeData,
					prerenderedErrorPageFetch,
					getStaticAsset:
						routeData.prerender && shouldServePrerenderedThroughMiddleware
							? getStaticAsset
							: undefined,
				}),
			);
			await writeResponse(response, res);
		} else if (next) {
			// Since we're not calling `writeResponse()`, clean up the AbortController and socket listeners
			const cleanup = getAbortControllerCleanup(req);
			if (cleanup) cleanup();
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
