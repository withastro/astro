import type http from 'node:http';
import {
	DEFAULT_404_COMPONENT,
	REROUTE_DIRECTIVE_HEADER,
	REWRITE_DIRECTIVE_HEADER_KEY,
	clientLocalsSymbol,
} from '../core/constants.js';
import { AstroErrorData, isAstroError } from '../core/errors/index.js';
import { req } from '../core/messages.js';
import { loadMiddleware } from '../core/middleware/loadMiddleware.js';
import { routeIsRedirect } from '../core/redirects/index.js';
import { RenderContext } from '../core/render-context.js';
import { type SSROptions, getProps } from '../core/render/index.js';
import { createRequest } from '../core/request.js';
import { redirectTemplate } from '../core/routing/3xx.js';
import { matchAllRoutes } from '../core/routing/index.js';
import { getSortedPreloadedMatches } from '../prerender/routing.js';
import type { ComponentInstance, ManifestData } from '../types/astro.js';
import type { RouteData } from '../types/public/internal.js';
import type { DevPipeline } from './pipeline.js';
import { writeSSRResult, writeWebResponse } from './response.js';

type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (
	...args: any
) => Promise<infer R>
	? R
	: any;

export interface MatchedRoute {
	route: RouteData;
	filePath: URL;
	resolvedPathname: string;
	preloadedComponent: ComponentInstance;
	mod: ComponentInstance;
}

function isLoggedRequest(url: string) {
	return url !== '/favicon.ico';
}

function getCustom404Route(manifestData: ManifestData): RouteData | undefined {
	const route404 = /^\/404\/?$/;
	return manifestData.routes.find((r) => route404.test(r.route));
}

function getCustom500Route(manifestData: ManifestData): RouteData | undefined {
	const route500 = /^\/500\/?$/;
	return manifestData.routes.find((r) => route500.test(r.route));
}

export async function matchRoute(
	pathname: string,
	manifestData: ManifestData,
	pipeline: DevPipeline,
): Promise<MatchedRoute | undefined> {
	const { config, logger, routeCache, serverLike, settings } = pipeline;
	const matches = matchAllRoutes(pathname, manifestData);

	const preloadedMatches = await getSortedPreloadedMatches({ pipeline, matches, settings });

	for await (const { preloadedComponent, route: maybeRoute, filePath } of preloadedMatches) {
		// attempt to get static paths
		// if this fails, we have a bad URL match!
		try {
			await getProps({
				mod: preloadedComponent,
				routeData: maybeRoute,
				routeCache,
				pathname: pathname,
				logger,
				serverLike,
				base: config.base,
			});
			return {
				route: maybeRoute,
				filePath,
				resolvedPathname: pathname,
				preloadedComponent,
				mod: preloadedComponent,
			};
		} catch (e) {
			// Ignore error for no matching static paths
			if (isAstroError(e) && e.title === AstroErrorData.NoMatchingStaticPathFound.title) {
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
		return await matchRoute(altPathname, manifestData, pipeline);
	}

	if (matches.length) {
		const possibleRoutes = matches.flatMap((route) => route.component);

		logger.warn(
			'router',
			`${AstroErrorData.NoMatchingStaticPathFound.message(
				pathname,
			)}\n\n${AstroErrorData.NoMatchingStaticPathFound.hint(possibleRoutes)}`,
		);
	}

	const custom404 = getCustom404Route(manifestData);

	if (custom404) {
		const filePath = new URL(`./${custom404.component}`, config.root);
		const preloadedComponent = await pipeline.preload(custom404, filePath);

		return {
			route: custom404,
			filePath,
			resolvedPathname: pathname,
			preloadedComponent,
			mod: preloadedComponent,
		};
	}

	return undefined;
}

type HandleRoute = {
	matchedRoute: AsyncReturnType<typeof matchRoute>;
	url: URL;
	pathname: string;
	body: ArrayBuffer | undefined;
	origin: string;
	manifestData: ManifestData;
	incomingRequest: http.IncomingMessage;
	incomingResponse: http.ServerResponse;
	status?: 404 | 500 | 200;
	pipeline: DevPipeline;
};

export async function handleRoute({
	matchedRoute,
	url,
	pathname,
	status = getStatus(matchedRoute),
	body,
	origin,
	pipeline,
	manifestData,
	incomingRequest,
	incomingResponse,
}: HandleRoute): Promise<void> {
	const timeStart = performance.now();
	const { config, loader, logger } = pipeline;

	if (!matchedRoute) {
		// This should never happen, because ensure404Route will add a 404 route if none exists.
		throw new Error('No route matched, and default 404 route was not found.');
	}

	let request: Request;
	let renderContext: RenderContext;
	let mod: ComponentInstance | undefined = undefined;
	let options: SSROptions | undefined = undefined;
	let route: RouteData;
	const middleware = (await loadMiddleware(loader)).onRequest;
	const locals = Reflect.get(incomingRequest, clientLocalsSymbol);

	const filePath: URL | undefined = matchedRoute.filePath;
	const { preloadedComponent } = matchedRoute;
	route = matchedRoute.route;

	// Allows adapters to pass in locals in dev mode.
	request = createRequest({
		url,
		headers: incomingRequest.headers,
		method: incomingRequest.method,
		body,
		logger,
		clientAddress: incomingRequest.socket.remoteAddress,
		isPrerendered: route.prerender,
	});

	// Set user specified headers to response object.
	for (const [name, value] of Object.entries(config.server.headers ?? {})) {
		if (value) incomingResponse.setHeader(name, value);
	}

	options = {
		pipeline,
		filePath,
		preload: preloadedComponent,
		pathname,
		request,
		route,
	};

	mod = preloadedComponent;

	const isDefaultPrerendered404 =
		matchedRoute.route.route === '/404' &&
		matchedRoute.route.prerender &&
		matchedRoute.route.component === DEFAULT_404_COMPONENT;

	renderContext = await RenderContext.create({
		locals,
		pipeline,
		pathname,
		middleware: isDefaultPrerendered404 ? undefined : middleware,
		request,
		routeData: route,
	});

	let response;
	let isReroute = false;
	let isRewrite = false;
	try {
		response = await renderContext.render(mod);
		isReroute = response.headers.has(REROUTE_DIRECTIVE_HEADER);
		isRewrite = response.headers.has(REWRITE_DIRECTIVE_HEADER_KEY);
	} catch (err: any) {
		const custom500 = getCustom500Route(manifestData);
		if (!custom500) {
			throw err;
		}
		// Log useful information that the custom 500 page may not display unlike the default error overlay
		logger.error('router', err.stack || err.message);
		const filePath500 = new URL(`./${custom500.component}`, config.root);
		const preloaded500Component = await pipeline.preload(custom500, filePath500);
		renderContext.props.error = err;
		response = await renderContext.render(preloaded500Component);
		status = 500;
	}

	if (isLoggedRequest(pathname)) {
		const timeEnd = performance.now();
		logger.info(
			null,
			req({
				url: pathname,
				method: incomingRequest.method,
				statusCode: isRewrite ? response.status : (status ?? response.status),
				isRewrite,
				reqTime: timeEnd - timeStart,
			}),
		);
	}
	if (response.status === 404 && response.headers.get(REROUTE_DIRECTIVE_HEADER) !== 'no') {
		const fourOhFourRoute = await matchRoute('/404', manifestData, pipeline);
		if (options && options.route !== fourOhFourRoute?.route)
			return handleRoute({
				...options,
				matchedRoute: fourOhFourRoute,
				url: new URL(pathname, url),
				status: 404,
				body,
				origin,
				pipeline,
				manifestData,
				incomingRequest,
				incomingResponse,
			});
	}

	// We remove the internally-used header before we send the response to the user agent.
	if (isReroute) {
		response.headers.delete(REROUTE_DIRECTIVE_HEADER);
	}
	if (isRewrite) {
		response.headers.delete(REROUTE_DIRECTIVE_HEADER);
	}

	if (route.type === 'endpoint') {
		await writeWebResponse(incomingResponse, response);
		return;
	}

	// This check is important in case of rewrites.
	// A route can start with a 404 code, then the rewrite kicks in and can return a 200 status code
	if (isRewrite) {
		await writeSSRResult(request, response, incomingResponse);
		return;
	}

	// We are in a recursion, and it's possible that this function is called itself with a status code
	// By default, the status code passed via parameters is computed by the matched route.
	//
	// By default, we should give priority to the status code passed, although it's possible that
	// the `Response` emitted by the user is a redirect. If so, then return the returned response.
	if (response.status < 400 && response.status >= 300) {
		if (
			response.status >= 300 &&
			response.status < 400 &&
			routeIsRedirect(route) &&
			!config.build.redirects &&
			pipeline.settings.buildOutput === 'static'
		) {
			// If we're here, it means that the calling static redirect that was configured by the user
			// We try to replicate the same behaviour that we provide during a static build
			response = new Response(
				redirectTemplate({
					status: response.status,
					location: response.headers.get('location')!,
					from: pathname,
				}),
				{
					status: 200,
					headers: {
						...response.headers,
						'content-type': 'text/html',
					},
				},
			);
		}
		await writeSSRResult(request, response, incomingResponse);
		return;
	}

	// Apply the `status` override to the response object before responding.
	// Response.status is read-only, so a clone is required to override.
	if (status && response.status !== status && (status === 404 || status === 500)) {
		response = new Response(response.body, {
			status: status,
			headers: response.headers,
		});
	}
	await writeSSRResult(request, response, incomingResponse);
}

function getStatus(matchedRoute?: MatchedRoute): 404 | 500 | 200 {
	if (!matchedRoute) return 404;
	if (matchedRoute.route.route === '/404') return 404;
	if (matchedRoute.route.route === '/500') return 500;
	return 200;
}
