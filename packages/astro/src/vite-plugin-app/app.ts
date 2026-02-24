import type http from 'node:http';
import { removeTrailingForwardSlash } from '@astrojs/internal-helpers/path';
import { BaseApp, type RenderErrorOptions } from '../core/app/entrypoints/index.js';
import { shouldAppendForwardSlash } from '../core/build/util.js';
import { clientLocalsSymbol } from '../core/constants.js';
import {
	MiddlewareNoDataOrNextCalled,
	MiddlewareNotAResponse,
} from '../core/errors/errors-data.js';
import { type AstroError, createSafeError, isAstroError } from '../core/errors/index.js';
import type { Logger } from '../core/logger/core.js';
import type { ModuleLoader } from '../core/module-loader/index.js';
import type { CreateRenderContext, RenderContext } from '../core/render-context.js';
import { createRequest } from '../core/request.js';
import type { AstroSettings, RoutesList } from '../types/astro.js';
import type { RouteData, SSRManifest } from '../types/public/index.js';
import type { DevServerController } from '../vite-plugin-astro-server/controller.js';
import { recordServerError } from '../vite-plugin-astro-server/error.js';
import { runWithErrorHandling } from '../vite-plugin-astro-server/index.js';
import { handle500Response, writeSSRResult } from '../vite-plugin-astro-server/response.js';
import { RunnablePipeline } from './pipeline.js';
import { getCustom404Route, getCustom500Route } from '../core/routing/helpers.js';
import { ensure404Route } from '../core/routing/astro-designed-error-pages.js';
import { matchRoute } from '../core/routing/dev.js';
import type { DevMatch, LogRequestPayload } from '../core/app/base.js';
import { req } from '../core/messages/runtime.js';

export class AstroServerApp extends BaseApp<RunnablePipeline> {
	settings: AstroSettings;
	logger: Logger;
	loader: ModuleLoader;
	manifestData: RoutesList;
	currentRenderContext: RenderContext | undefined = undefined;
	resolvedPathname: string | undefined = undefined;
	constructor(
		manifest: SSRManifest,
		streaming = true,
		logger: Logger,
		manifestData: RoutesList,
		loader: ModuleLoader,
		settings: AstroSettings,
		getDebugInfo: () => Promise<string>,
	) {
		super(manifest, streaming, settings, logger, loader, manifestData, getDebugInfo);
		this.settings = settings;
		this.logger = logger;
		this.loader = loader;
		this.manifestData = manifestData;
	}

	isDev(): boolean {
		return true;
	}

	/**
	 * Updates the routes list when files change during development.
	 * Called via HMR when new pages are added/removed.
	 */
	updateRoutes(newRoutesList: RoutesList): void {
		this.manifestData = newRoutesList;
		this.pipeline.setManifestData(newRoutesList);
		ensure404Route(this.manifestData);
	}

	/**
	 * Clears the route cache so that getStaticPaths() is re-evaluated.
	 * Called via HMR when content collection data changes.
	 */
	clearRouteCache(): void {
		this.pipeline.clearRouteCache();
	}

	async devMatch(pathname: string): Promise<DevMatch | undefined> {
		const matchedRoute = await matchRoute(
			pathname,
			this.manifestData,
			this.pipeline as unknown as RunnablePipeline,
			this.manifest,
		);
		if (!matchedRoute) {
			return undefined;
		}

		return {
			routeData: matchedRoute.route,
			resolvedPathname: matchedRoute.resolvedPathname,
		};
	}

	static async create(
		manifest: SSRManifest,
		routesList: RoutesList,
		logger: Logger,
		loader: ModuleLoader,
		settings: AstroSettings,
		getDebugInfo: () => Promise<string>,
	): Promise<AstroServerApp> {
		return new AstroServerApp(manifest, true, logger, routesList, loader, settings, getDebugInfo);
	}

	createPipeline(
		_streaming: boolean,
		manifest: SSRManifest,
		settings: AstroSettings,
		logger: Logger,
		loader: ModuleLoader,
		manifestData: RoutesList,
		getDebugInfo: () => Promise<string>,
	): RunnablePipeline {
		const pipeline = RunnablePipeline.create(manifestData, {
			loader,
			logger,
			manifest,
			settings,
			getDebugInfo,
		});

		return pipeline;
	}

	async createRenderContext(payload: CreateRenderContext): Promise<RenderContext> {
		this.currentRenderContext = await super.createRenderContext({
			...payload,
			pathname: this.resolvedPathname ?? payload.pathname,
		});
		return this.currentRenderContext;
	}

	public async handleRequest({
		controller,
		incomingRequest,
		incomingResponse,
		isHttps,
	}: HandleRequest): Promise<void> {
		const origin = `${isHttps ? 'https' : 'http'}://${
			incomingRequest.headers[':authority'] ?? incomingRequest.headers.host
		}`;

		const url = new URL(origin + incomingRequest.url);
		let pathname: string;
		if (this.manifest.trailingSlash === 'never' && !incomingRequest.url) {
			pathname = '';
		} else {
			// We already have a middleware that checks if there's an incoming URL that has invalid URI, so it's safe
			// to not handle the error: packages/astro/src/vite-plugin-astro-server/base.ts
			pathname = decodeURI(url.pathname);
		}

		// Normalize root path to empty string when trailingSlash is 'never' and there's a non-root base
		// This ensures consistent route matching for the index route (e.g., /base?query -> '')
		if (this.manifest.trailingSlash === 'never' && pathname === '/' && this.manifest.base !== '/') {
			pathname = '';
		}

		// Add config.base back to url before passing it to SSR
		url.pathname = removeTrailingForwardSlash(this.manifest.base) + url.pathname;
		if (
			url.pathname.endsWith('/') &&
			!shouldAppendForwardSlash(this.manifest.trailingSlash, this.manifest.buildFormat)
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
				const matchedRoute = await self.devMatch(pathname);
				if (!matchedRoute) {
					// This should never happen, because ensure404Route will add a 404 route if none exists.
					throw new Error('No route matched, and default 404 route was not found.');
				}

				self.resolvedPathname = matchedRoute.resolvedPathname;
				const request = createRequest({
					url,
					headers: incomingRequest.headers,
					method: incomingRequest.method,
					body,
					logger: self.logger,
					isPrerendered: matchedRoute.routeData.prerender,
					routePattern: matchedRoute.routeData.component,
				});

				// This is required for adapters to set locals in dev mode. They use a dev server middleware to inject locals to the `http.IncomingRequest` object.
				const locals = Reflect.get(incomingRequest, clientLocalsSymbol);

				// Set user specified headers to response object.
				for (const [name, value] of Object.entries(self.settings.config.server.headers ?? {})) {
					if (value) incomingResponse.setHeader(name, value);
				}
				const clientAddress = incomingRequest.socket.remoteAddress;

				const response = await self.render(request, {
					locals,
					routeData: matchedRoute.routeData,
					clientAddress,
				});

				await writeSSRResult(request, response, incomingResponse);
			},
			onError(_err) {
				const error = createSafeError(_err);
				if (self.loader) {
					const { errorWithMetadata } = recordServerError(
						self.loader,
						self.manifest,
						self.logger,
						error,
					);
					handle500Response(self.loader, incomingResponse, errorWithMetadata);
				}
				return error;
			},
		});
	}

	match(request: Request, _allowPrerenderedRoutes: boolean): RouteData | undefined {
		return super.match(request, true);
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

		const renderRoute = async (routeData: RouteData) => {
			try {
				const preloadedComponent = await this.pipeline.getComponentByRoute(routeData);
				const renderContext = await this.createRenderContext({
					locals,
					pipeline: this.pipeline,
					pathname: await this.getPathnameFromRequest(request),
					skipMiddleware,
					request,
					routeData,
					clientAddress,
					status,
					shouldInjectCspMetaTags: !!this.manifest.csp,
				});
				renderContext.props.error = error;
				const response = await renderContext.render(preloadedComponent);

				if (error) {
					// Log useful information that the custom 500 page may not display unlike the default error overlay
					this.logger.error('router', (error as AstroError).stack || (error as AstroError).message);
				}

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
		};

		if (status === 404) {
			const custom404 = getCustom404Route(this.manifestData);
			if (custom404) {
				return renderRoute(custom404);
			}
		}

		const custom500 = getCustom500Route(this.manifestData);

		// Show dev overlay
		if (!custom500) {
			throw error;
		} else {
			return renderRoute(custom500);
		}
	}

	logRequest({ pathname, method, statusCode, isRewrite, reqTime }: LogRequestPayload) {
		if (pathname === '/favicon.ico') {
			return;
		}
		this.logger.info(
			null,
			req({
				url: pathname,
				method,
				statusCode,
				isRewrite,
				reqTime,
			}),
		);
	}
}

type HandleRequest = {
	controller: DevServerController;
	incomingRequest: http.IncomingMessage;
	incomingResponse: http.ServerResponse;
	isHttps: boolean;
};
