import type http from 'node:http';
import { prependForwardSlash, removeTrailingForwardSlash } from '@astrojs/internal-helpers/path';
import { loadActions } from '../actions/loadActions.js';
import { BaseApp, type RenderErrorOptions } from '../core/app/index.js';
import type { SSRManifest } from '../core/app/types.js';
import { shouldAppendForwardSlash } from '../core/build/util.js';
import {
	clientLocalsSymbol,
	DEFAULT_404_COMPONENT,
	NOOP_MIDDLEWARE_HEADER,
	REROUTE_DIRECTIVE_HEADER,
	REWRITE_DIRECTIVE_HEADER_KEY,
} from '../core/constants.js';
import {
	MiddlewareNoDataOrNextCalled,
	MiddlewareNotAResponse,
	NoMatchingStaticPathFound,
} from '../core/errors/errors-data.js';
import { type AstroError, isAstroError } from '../core/errors/index.js';
import type { Logger } from '../core/logger/core.js';
import { req } from '../core/messages.js';
import { loadMiddleware } from '../core/middleware/loadMiddleware.js';
import type { ModuleLoader } from '../core/module-loader/index.js';
import { routeIsRedirect } from '../core/redirects/index.js';
import { getProps } from '../core/render/index.js';
import type { CreateRenderContext, RenderContext } from '../core/render-context.js';
import { createRequest } from '../core/request.js';
import { redirectTemplate } from '../core/routing/3xx.js';
import { isRoute404, isRoute500, matchAllRoutes } from '../core/routing/match.js';
import { PERSIST_SYMBOL } from '../core/session.js';
import { getSortedPreloadedMatches } from '../prerender/routing.js';
import type { AstroSettings, RoutesList } from '../types/astro.js';
import type { RouteData } from '../types/public/index.js';
import { type DevServerController, runWithErrorHandling } from './controller.js';
import { recordServerError } from './error.js';
import { DevPipeline } from './pipeline.js';
import { handle500Response, writeSSRResult, writeWebResponse } from './response.js';

export class DevApp extends BaseApp<DevPipeline> {
	settings: AstroSettings;
	logger: Logger;
	loader: ModuleLoader;
	manifestData: RoutesList;
	currentRenderContext: RenderContext | undefined = undefined;
	constructor(
		manifest: SSRManifest,
		streaming = true,
		settings: AstroSettings,
		logger: Logger,
		loader: ModuleLoader,
		manifestData: RoutesList,
	) {
		super(manifest, streaming, settings, logger, loader, manifestData);
		this.settings = settings;
		this.logger = logger;
		this.loader = loader;
		this.manifestData = manifestData;
	}

	// TODO remove routelist once it's a plugin
	static async create(
		routesList: RoutesList,
		settings: AstroSettings,
		logger: Logger,
		loader: ModuleLoader,
	): Promise<DevApp> {
		const { manifest } = await loader.import('astro:serialized-manifest');
		return new DevApp(manifest as SSRManifest, true, settings, logger, loader, routesList);
	}

	createPipeline(
		_streaming: boolean,
		manifest: SSRManifest,
		settings: AstroSettings,
		logger: Logger,
		loader: ModuleLoader,
		manifestData: RoutesList,
	): DevPipeline {
		return DevPipeline.create(manifestData, {
			loader,
			logger,
			manifest,
			settings,
		});
	}

	async createRenderContext(payload: CreateRenderContext): Promise<RenderContext> {
		this.currentRenderContext = await super.createRenderContext(payload);
		return this.currentRenderContext;
	}

	public clearRouteCache() {
		this.pipeline.clearRouteCache();
	}

	public async handleRequest({
		controller,
		incomingRequest,
		incomingResponse,
	}: HandleRequest): Promise<void> {
		const { config, loader } = this.pipeline;
		const origin = `${loader.isHttps() ? 'https' : 'http'}://${
			incomingRequest.headers[':authority'] ?? incomingRequest.headers.host
		}`;

		const url = new URL(origin + incomingRequest.url);
		let pathname: string;
		if (config.trailingSlash === 'never' && !incomingRequest.url) {
			pathname = '';
		} else {
			// We already have a middleware that checks if there's an incoming URL that has invalid URI, so it's safe
			// to not handle the error: packages/astro/src/vite-plugin-astro-server/base.ts
			pathname = decodeURI(url.pathname);
		}

		// Add config.base back to url before passing it to SSR
		url.pathname = removeTrailingForwardSlash(config.base) + url.pathname;
		if (
			url.pathname.endsWith('/') &&
			!shouldAppendForwardSlash(config.trailingSlash, config.build.format)
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

		const self = this;
		await runWithErrorHandling({
			controller,
			pathname,
			async run() {
				const matchedRoute = await matchRoute(pathname, self.manifestData, self.pipeline);
				const resolvedPathname = matchedRoute?.resolvedPathname ?? pathname;
				return await self.handleRoute({
					matchedRoute,
					url,
					pathname: resolvedPathname,
					body,
					incomingRequest: incomingRequest,
					incomingResponse: incomingResponse,
				});
			},
			onError(_err) {
				const { error, errorWithMetadata } = recordServerError(loader, config, self.logger, _err);
				handle500Response(loader, incomingResponse, errorWithMetadata);
				return error;
			},
		});
	}

	async handleRoute({
		matchedRoute,
		incomingRequest,
		incomingResponse,
		body,
		url,
		pathname,
	}: HandleRoute): Promise<void> {
		const timeStart = performance.now();
		const { config, loader, logger } = this.pipeline;

		if (!matchedRoute) {
			// This should never happen, because ensure404Route will add a 404 route if none exists.
			throw new Error('No route matched, and default 404 route was not found.');
		}

		let request: Request;
		let renderContext: RenderContext;
		let route: RouteData = matchedRoute.route;
		const componentInstance = await this.pipeline.getComponentByRoute(route);
		const actions = await loadActions(loader);
		this.pipeline.setActions(actions);
		const middleware = (await loadMiddleware(loader)).onRequest;
		// This is required for adapters to set locals in dev mode. They use a dev server middleware to inject locals to the `http.IncomingRequest` object.
		const locals = Reflect.get(incomingRequest, clientLocalsSymbol);

		// Allows adapters to pass in locals in dev mode.
		request = createRequest({
			url,
			headers: incomingRequest.headers,
			method: incomingRequest.method,
			body,
			logger,
			isPrerendered: route.prerender,
			routePattern: route.component,
		});

		// Set user specified headers to response object.
		for (const [name, value] of Object.entries(config.server.headers ?? {})) {
			if (value) incomingResponse.setHeader(name, value);
		}

		renderContext = await this.createRenderContext({
			locals,
			pipeline: this.pipeline,
			pathname,
			middleware: isDefaultPrerendered404(matchedRoute.route) ? undefined : middleware,
			request,
			routeData: route,
			clientAddress: incomingRequest.socket.remoteAddress,
			actions,
			shouldInjectCspMetaTags: false,
		});

		let response;
		let statusCode = 200;
		let isReroute = false;
		let isRewrite = false;

		try {
			response = await renderContext.render(componentInstance);
			isReroute = response.headers.has(REROUTE_DIRECTIVE_HEADER);
			isRewrite = response.headers.has(REWRITE_DIRECTIVE_HEADER_KEY);
			const statusCodedMatched = getStatusByMatchedRoute(route);
			statusCode = isRewrite
				? // Ignore `matchedRoute` status for rewrites
					response.status
				: // Our internal noop middleware sets a particular header. If the header isn't present, it means that the user have
					// their own middleware, so we need to return what the user returns.
					!response.headers.has(NOOP_MIDDLEWARE_HEADER) && !isReroute
					? response.status
					: (statusCodedMatched ?? response.status);
		} catch (err: any) {
			response = await this.renderError(request, {
				skipMiddleware: false,
				locals,
				status: 500,
				prerenderedErrorPageFetch: fetch,
				clientAddress: incomingRequest.socket.remoteAddress,
				error: err,
			});
			statusCode = 500;
		} finally {
			this.currentRenderContext?.session?.[PERSIST_SYMBOL]();
		}

		if (isLoggedRequest(pathname)) {
			const timeEnd = performance.now();
			logger.info(
				null,
				req({
					url: pathname,
					method: incomingRequest.method,
					statusCode,
					isRewrite,
					reqTime: timeEnd - timeStart,
				}),
			);
		}

		if (
			statusCode === 404 &&
			// If the body isn't null, that means the user sets the 404 status
			// but uses the current route to handle the 404
			response.body === null &&
			response.headers.get(REROUTE_DIRECTIVE_HEADER) !== 'no'
		) {
			const fourOhFourRoute = await matchRoute('/404', this.manifestData, this.pipeline);
			if (fourOhFourRoute) {
				renderContext = await this.createRenderContext({
					locals,
					pipeline: this.pipeline,
					pathname,
					middleware: isDefaultPrerendered404(fourOhFourRoute.route) ? undefined : middleware,
					request,
					routeData: fourOhFourRoute.route,
					clientAddress: incomingRequest.socket.remoteAddress,
					status: 404,
					shouldInjectCspMetaTags: false,
				});
				const component = await this.pipeline.preload(
					fourOhFourRoute.route,
					fourOhFourRoute.filePath,
				);
				response = await renderContext.render(component);
			}
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
				this.pipeline.settings.buildOutput === 'static'
			) {
				// If we're here, it means that the calling static redirect that was configured by the user
				// We try to replicate the same behaviour that we provide during a static build
				const location = response.headers.get('location')!;
				response = new Response(
					redirectTemplate({
						status: response.status,
						absoluteLocation: location,
						relativeLocation: location,
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
		if (response.status !== statusCode) {
			response = new Response(response.body, {
				status: statusCode,
				headers: response.headers,
			});
		}
		await writeSSRResult(request, response, incomingResponse);
	}

	match(request: Request, _allowPrerenderedRoutes: boolean): RouteData | undefined {
		const url = new URL(request.url);
		// ignore requests matching public assets
		if (this.manifest.assets.has(url.pathname)) return undefined;
		let pathname = prependForwardSlash(this.removeBase(url.pathname));

		return this.manifestData.routes.find((route) => {
			return (
				route.pattern.test(pathname) ||
				route.fallbackRoutes.some((fallbackRoute) => fallbackRoute.pattern.test(pathname))
			);
		});
	}

	async renderError(
		request: Request,
		{ locals, skipMiddleware = false, error, clientAddress, status }: RenderErrorOptions,
	): Promise<Response> {
		// we always throw when we have Astro errors around the middleware
		if (
			isAstroError(error) &&
			[MiddlewareNoDataOrNextCalled.name, MiddlewareNotAResponse.name].includes(error.name)
		) {
			throw error;
		}

		const custom500 = getCustom500Route(this.manifestData);
		// Show dev overlay
		if (!custom500) {
			throw error;
		}

		try {
			const filePath500 = new URL(`./${custom500.component}`, this.settings.config.root);
			const preloaded500Component = await this.pipeline.preload(custom500, filePath500);
			const renderContext = await this.createRenderContext({
				locals,
				pipeline: this.pipeline,
				pathname: this.getPathnameFromRequest(request),
				middleware: skipMiddleware ? undefined : await this.pipeline.getMiddleware(),
				request,
				routeData: custom500,
				clientAddress,
				actions: await this.pipeline.getActions(),
				status,
				shouldInjectCspMetaTags: false,
			});
			renderContext.props.error = error;
			const response = await renderContext.render(preloaded500Component);
			// Log useful information that the custom 500 page may not display unlike the default error overlay
			this.logger.error('router', (error as AstroError).stack || (error as AstroError).message);
			return response;
		} catch (_err) {
			if (skipMiddleware === false) {
				return this.renderError(request, {
					clientAddress: undefined,
					prerenderedErrorPageFetch: fetch,
					status: 500,
					skipMiddleware: true,
					error: _err,
				});
			}
			// If even skipping the middleware isn't enough to prevent the error, show the dev overlay
			throw _err;
		}
	}
}

/** Check for /404 and /500 custom routes to compute status code */
function getStatusByMatchedRoute(route: RouteData) {
	if (route.route === '/404') return 404;
	if (route.route === '/500') return 500;
	return undefined;
}

function isDefaultPrerendered404(route: RouteData) {
	return route.route === '/404' && route.prerender && route.component === DEFAULT_404_COMPONENT;
}

function isLoggedRequest(url: string) {
	return url !== '/favicon.ico';
}

type HandleRequest = {
	controller: DevServerController;
	incomingRequest: http.IncomingMessage;
	incomingResponse: http.ServerResponse;
};

type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (
	...args: any
) => Promise<infer R>
	? R
	: any;

type HandleRoute = {
	matchedRoute: AsyncReturnType<typeof matchRoute>;
	url: URL;
	pathname: string;
	body: BodyInit | undefined;
	incomingRequest: http.IncomingMessage;
	incomingResponse: http.ServerResponse;
};

interface MatchedRoute {
	route: RouteData;
	filePath: URL;
	resolvedPathname: string;
}

async function matchRoute(
	pathname: string,
	routesList: RoutesList,
	pipeline: DevPipeline,
): Promise<MatchedRoute | undefined> {
	const { config, logger, routeCache, serverLike, settings } = pipeline;
	const matches = matchAllRoutes(pathname, routesList);

	const preloadedMatches = await getSortedPreloadedMatches({ pipeline, matches, settings });

	for await (const { route: maybeRoute, filePath } of preloadedMatches) {
		// attempt to get static paths
		// if this fails, we have a bad URL match!
		try {
			await getProps({
				mod: await pipeline.preload(maybeRoute, filePath),
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
		return await matchRoute(altPathname, routesList, pipeline);
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
		const filePath = new URL(`./${custom404.component}`, config.root);

		return {
			route: custom404,
			filePath,
			resolvedPathname: pathname,
		};
	}

	return undefined;
}

function getCustom404Route(manifestData: RoutesList): RouteData | undefined {
	return manifestData.routes.find((r) => isRoute404(r.route));
}

function getCustom500Route(manifestData: RoutesList): RouteData | undefined {
	return manifestData.routes.find((r) => isRoute500(r.route));
}
