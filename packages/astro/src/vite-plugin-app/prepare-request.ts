import { shouldAppendForwardSlash } from '../core/build/util.js';
import { runWithErrorHandling } from '../vite-plugin-astro-server/index.js';
import { createRequest } from '../core/request.js';
import { clientLocalsSymbol } from '../core/constants.js';
import { handle500Response, writeSSRResult } from '../vite-plugin-astro-server/response.js';
import { createSafeError, isAstroError } from '../core/errors/index.js';
import { recordServerError } from '../vite-plugin-astro-server/error.js';
import type { DevServerController } from '../vite-plugin-astro-server/controller.js';
import type http from 'node:http';
import type { RoutesList } from '../types/astro.js';
import type { SSRManifest } from '../core/app/types.js';
import { matchAllRoutes } from '../core/routing/index.js';
import { getSortedPreloadedMatches } from '../prerender/routing.js';
import { getProps, type Pipeline } from '../core/render/index.js';
import { NoMatchingStaticPathFound } from '../core/errors/errors-data.js';
import { getCustom404Route } from '../core/routing/helpers.js';
import type { RouteData } from '../types/public/index.js';
import type { BaseApp } from '../core/app/index.js';
import type { ModuleLoader } from '../core/module-loader/index.js';
import { removeTrailingForwardSlash } from '@astrojs/internal-helpers/path';
import type { RunnablePipeline } from './pipeline.js';

interface HandleRequest {
	controller: DevServerController;
	incomingRequest: http.IncomingMessage;
	incomingResponse: http.ServerResponse;
	isHttps: boolean;
	app: BaseApp<RunnablePipeline>;
	run: (payload: RunPayload) => Promise<Response>;
	devServerHeaders: http.OutgoingHttpHeaders | undefined;
	loader: ModuleLoader;
}

interface RunPayload {
	request: Request;
	locals?: Record<string, unknown>;
	routeData: RouteData;
	clientAddress?: string;
	resolvedPathname: string;
}

interface MatchedRoute {
	route: RouteData;
	filePath: URL;
	resolvedPathname: string;
}

/**
 * Prepare the `Request` to be rendered
 */
export async function prepareRequest({
	controller,
	incomingRequest,
	incomingResponse,
	isHttps,
	app,
	run,
	devServerHeaders,
	loader,
}: HandleRequest): Promise<void> {
	const origin = `${isHttps ? 'https' : 'http'}://${
		incomingRequest.headers[':authority'] ?? incomingRequest.headers.host
	}`;

	const url = new URL(origin + incomingRequest.url);
	let pathname: string;
	if (app.manifest.trailingSlash === 'never' && !incomingRequest.url) {
		pathname = '';
	} else {
		// We already have a middleware that checks if there's an incoming URL that has invalid URI, so it's safe
		// to not handle the error: packages/astro/src/vite-plugin-astro-server/base.ts
		pathname = decodeURI(url.pathname);
	}

	// Normalize root path to empty string when trailingSlash is 'never' and there's a non-root base
	// This ensures consistent route matching for the index route (e.g., /base?query -> '')
	if (app.manifest.trailingSlash === 'never' && pathname === '/' && app.manifest.base !== '/') {
		pathname = '';
	}

	// Add config.base back to url before passing it to SSR
	url.pathname = removeTrailingForwardSlash(app.manifest.base) + url.pathname;
	if (
		url.pathname.endsWith('/') &&
		!shouldAppendForwardSlash(app.manifest.trailingSlash, app.manifest.buildFormat)
	) {
		url.pathname = url.pathname.slice(0, -1);
	}

	let body: BodyInit | undefined = undefined;
	if (!(incomingRequest.method === 'GET' || incomingRequest.method === 'HEAD')) {
		let bytes: Uint8Array[] = [];
		await new Promise((resolve) => {
			incomingRequest.on('data', (part) => {
				bytes.push(part);
			});
			incomingRequest.on('end', resolve);
		});
		body = Buffer.concat(bytes);
	}

	await runWithErrorHandling({
		controller,
		pathname,
		async run() {
			const matchedRoute = await matchRoute(pathname, app.manifestData, app.pipeline, app.manifest);
			if (!matchedRoute) {
				// This should never happen, because ensure404Route will add a 404 route if none exists.
				throw new Error('No route matched, and default 404 route was not found.');
			}

			const request = createRequest({
				url,
				headers: incomingRequest.headers,
				method: incomingRequest.method,
				body,
				logger: app.logger,
				isPrerendered: matchedRoute?.route.prerender,
				routePattern: matchedRoute?.route.component,
			});

			// This is required for adapters to set locals in dev mode. They use a dev server middleware to inject locals to the `http.IncomingRequest` object.
			const locals = Reflect.get(incomingRequest, clientLocalsSymbol);

			// Set user specified headers to response object.
			for (const [name, value] of Object.entries(devServerHeaders ?? {})) {
				if (value) incomingResponse.setHeader(name, value);
			}
			const clientAddress = incomingRequest.socket.remoteAddress;

			const response = await run({
				request,
				locals,
				routeData: matchedRoute.route,
				clientAddress,
				resolvedPathname: matchedRoute.resolvedPathname,
			});

			await writeSSRResult(request, response, incomingResponse);
		},
		onError(_err) {
			const error = createSafeError(_err);
			const { errorWithMetadata } = recordServerError(loader, app.manifest, app.logger, error);
			handle500Response(loader, incomingResponse, errorWithMetadata);

			return error;
		},
	});
}

async function matchRoute(
	pathname: string,
	routesList: RoutesList,
	pipeline: Pipeline,
	manifest: SSRManifest,
): Promise<MatchedRoute | undefined> {
	const { logger, routeCache } = pipeline;
	const matches = matchAllRoutes(pathname, routesList);

	const preloadedMatches = await getSortedPreloadedMatches({
		pipeline,
		matches,
		manifest,
	});

	for await (const { route: maybeRoute, filePath } of preloadedMatches) {
		// attempt to get static paths
		// if this fails, we have a bad URL match!
		try {
			await getProps({
				mod: await pipeline.getComponentByRoute(maybeRoute),
				routeData: maybeRoute,
				routeCache,
				pathname: pathname,
				logger,
				serverLike: pipeline.manifest.serverLike,
				base: manifest.base,
				trailingSlash: manifest.trailingSlash,
			});
			return {
				route: maybeRoute,
				filePath,
				resolvedPathname: pathname,
			};
		} catch (e) {
			// Ignore error for no matching static paths
			if (isAstroError(e) && e.title === NoMatchingStaticPathFound.title) {
				continue;
			}
			throw e;
		}
	}

	// Try without `.html` extensions or `index.html` in request URLs to mimic
	// routing behavior in production builds. This supports both file and directory
	// build formats, and is necessary based on how the manifest tracks build targets.
	const altPathname = pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');

	if (altPathname !== pathname) {
		return await matchRoute(altPathname, routesList, pipeline, manifest);
	}

	if (matches.length) {
		const possibleRoutes = matches.flatMap((route) => route.component);

		logger.warn(
			'router',
			`${NoMatchingStaticPathFound.message(
				pathname,
			)}\n\n${NoMatchingStaticPathFound.hint(possibleRoutes)}`,
		);
	}

	const custom404 = getCustom404Route(routesList);

	if (custom404) {
		const filePath = new URL(`./${custom404.component}`, manifest.rootDir);

		return {
			route: custom404,
			filePath,
			resolvedPathname: pathname,
		};
	}

	return undefined;
}
