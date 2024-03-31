import type http from 'node:http';
import type { ComponentInstance, ManifestData, RouteData } from '../@types/astro.js';
import {
	DEFAULT_404_COMPONENT,
	REROUTE_DIRECTIVE_HEADER,
	clientLocalsSymbol,
} from '../core/constants.js';
import { AstroErrorData, isAstroError } from '../core/errors/index.js';
import { req } from '../core/messages.js';
import { loadMiddleware } from '../core/middleware/loadMiddleware.js';
import { RenderContext } from '../core/render-context.js';
import { type SSROptions, getProps } from '../core/render/index.js';
import { createRequest } from '../core/request.js';
import { matchAllRoutes } from '../core/routing/index.js';
import { normalizeTheLocale } from '../i18n/index.js';
import { getSortedPreloadedMatches } from '../prerender/routing.js';
import type { DevPipeline } from './pipeline.js';
import { default404Page, handle404Response, writeSSRResult, writeWebResponse } from './response.js';

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

export async function matchRoute(
	pathname: string,
	manifestData: ManifestData,
	pipeline: DevPipeline
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
	const altPathname = pathname.replace(/(?:index)?\.html$/, '');
	if (altPathname !== pathname) {
		return await matchRoute(altPathname, manifestData, pipeline);
	}

	if (matches.length) {
		const possibleRoutes = matches.flatMap((route) => route.component);

		logger.warn(
			'router',
			`${AstroErrorData.NoMatchingStaticPathFound.message(
				pathname
			)}\n\n${AstroErrorData.NoMatchingStaticPathFound.hint(possibleRoutes)}`
		);
	}

	const custom404 = getCustom404Route(manifestData);

	if (custom404 && custom404.component === DEFAULT_404_COMPONENT) {
		const component: ComponentInstance = {
			default: default404Page,
		};
		return {
			route: custom404,
			filePath: new URL(`file://${custom404.component}`),
			resolvedPathname: pathname,
			preloadedComponent: component,
			mod: component,
		};
	}

	if (custom404) {
		const filePath = new URL(`./${custom404.component}`, config.root);
		const preloadedComponent = await pipeline.preload(filePath);

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
	status?: 404 | 500;
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
	if (!matchedRoute && !config.i18n) {
		if (isLoggedRequest(pathname)) {
			logger.info(null, req({ url: pathname, method: incomingRequest.method, statusCode: 404 }));
		}
		return handle404Response(origin, incomingRequest, incomingResponse);
	}

	let request: Request;
	let renderContext: RenderContext;
	let mod: ComponentInstance | undefined = undefined;
	let options: SSROptions | undefined = undefined;
	let route: RouteData;
	const middleware = (await loadMiddleware(loader)).onRequest;

	if (!matchedRoute) {
		if (config.i18n) {
			const locales = config.i18n.locales;
			const pathNameHasLocale = pathname
				.split('/')
				.filter(Boolean)
				.some((segment) => {
					let found = false;
					for (const locale of locales) {
						if (typeof locale === 'string') {
							if (normalizeTheLocale(locale) === normalizeTheLocale(segment)) {
								found = true;
								break;
							}
						} else {
							if (locale.path === segment) {
								found = true;
								break;
							}
						}
					}
					return found;
				});
			// Even when we have `config.base`, the pathname is still `/` because it gets stripped before
			if (!pathNameHasLocale && pathname !== '/') {
				return handle404Response(origin, incomingRequest, incomingResponse);
			}
			request = createRequest({
				base: config.base,
				url,
				headers: incomingRequest.headers,
				logger,
				// no route found, so we assume the default for rendering the 404 page
				staticLike: config.output === 'static' || config.output === 'hybrid',
			});
			route = {
				component: '',
				generate(_data: any): string {
					return '';
				},
				params: [],
				// Disable eslint as we only want to generate an empty RegExp
				// eslint-disable-next-line prefer-regex-literals
				pattern: new RegExp(''),
				prerender: false,
				segments: [],
				type: 'fallback',
				route: '',
				fallbackRoutes: [],
				isIndex: false,
			};
			renderContext = RenderContext.create({
				pipeline: pipeline,
				pathname,
				middleware,
				request,
				routeData: route,
			});
		} else {
			return handle404Response(origin, incomingRequest, incomingResponse);
		}
	} else {
		const filePath: URL | undefined = matchedRoute.filePath;
		const { preloadedComponent } = matchedRoute;
		route = matchedRoute.route;
		// Allows adapters to pass in locals in dev mode.
		const locals = Reflect.get(incomingRequest, clientLocalsSymbol);
		request = createRequest({
			base: config.base,
			url,
			headers: incomingRequest.headers,
			method: incomingRequest.method,
			body,
			logger,
			clientAddress: incomingRequest.socket.remoteAddress,
			staticLike: config.output === 'static' || route.prerender,
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
		renderContext = RenderContext.create({
			locals,
			pipeline,
			pathname,
			middleware,
			request,
			routeData: route,
		});
	}

	let response = await renderContext.render(mod);
	if (isLoggedRequest(pathname)) {
		const timeEnd = performance.now();
		logger.info(
			null,
			req({
				url: pathname,
				method: incomingRequest.method,
				statusCode: status ?? response.status,
				reqTime: timeEnd - timeStart,
			})
		);
	}
	if (response.status === 404 && response.headers.get(REROUTE_DIRECTIVE_HEADER) !== 'no') {
		const fourOhFourRoute = await matchRoute('/404', manifestData, pipeline);
		if (options)
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
	if (response.headers.has(REROUTE_DIRECTIVE_HEADER)) {
		response.headers.delete(REROUTE_DIRECTIVE_HEADER);
	}

	if (route.type === 'endpoint') {
		await writeWebResponse(incomingResponse, response);
		return;
	}
	// We are in a recursion, and it's possible that this function is called itself with a status code
	// By default, the status code passed via parameters is computed by the matched route.
	//
	// By default, we should give priority to the status code passed, although it's possible that
	// the `Response` emitted by the user is a redirect. If so, then return the returned response.
	if (response.status < 400 && response.status >= 300) {
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

function getStatus(matchedRoute?: MatchedRoute): 404 | 500 | undefined {
	if (!matchedRoute) return 404;
	if (matchedRoute.route.route === '/404') return 404;
	if (matchedRoute.route.route === '/500') return 500;
}

function has404Route(manifest: ManifestData): boolean {
	return manifest.routes.some((route) => route.route === '/404');
}
