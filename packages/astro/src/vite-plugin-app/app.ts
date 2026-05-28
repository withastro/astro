import type http from 'node:http';
import { removeTrailingForwardSlash } from '@astrojs/internal-helpers/path';
import { BaseApp } from '../core/app/entrypoints/index.js';
import { shouldAppendForwardSlash } from '../core/build/util.js';
import { clientLocalsSymbol } from '../core/constants.js';
import { createSafeError } from '../core/errors/index.js';
import { DevErrorHandler } from '../core/errors/dev-handler.js';
import type { ErrorHandler } from '../core/errors/handler.js';
import type { AstroLogger } from '../core/logger/core.js';
import type { ModuleLoader } from '../core/module-loader/index.js';

import { createRequest } from '../core/request.js';
import type { AstroSettings, RoutesList } from '../types/astro.js';
import type { RouteData, SSRManifest } from '../types/public/index.js';
import type { DevServerController } from '../vite-plugin-astro-server/controller.js';
import { recordServerError } from '../vite-plugin-astro-server/error.js';
import { runWithErrorHandling } from '../vite-plugin-astro-server/index.js';
import { handle500Response, writeSSRResult } from '../vite-plugin-astro-server/response.js';
import { RunnablePipeline } from './pipeline.js';
import { ensure404Route } from '../core/routing/astro-designed-error-pages.js';
import { matchRoute } from '../core/routing/dev.js';
import type { DevMatch, LogRequestPayload } from '../core/app/base.js';
import { req } from '../core/messages/runtime.js';

export class AstroServerApp extends BaseApp<RunnablePipeline> {
	settings: AstroSettings;
	loader: ModuleLoader;
	manifestData: RoutesList;

	constructor(
		manifest: SSRManifest,
		streaming = true,
		logger: AstroLogger,
		manifestData: RoutesList,
		loader: ModuleLoader,
		settings: AstroSettings,
		getDebugInfo: () => Promise<string>,
	) {
		super(manifest, streaming, settings, logger, loader, manifestData, getDebugInfo);
		this.settings = settings;
		this.loader = loader;
		this.manifestData = manifestData;
	}

	/**
	 * Loads the user's `src/app.ts` (via `virtual:astro:fetchable`) and
	 * sets it as the fetch handler. Called on every request so that HMR
	 * invalidation of the virtual module is picked up automatically.
	 * Vite caches the module internally so repeated calls are cheap.
	 */
	async #loadFetchHandler(): Promise<void> {
		try {
			const mod = await this.loader.import('virtual:astro:fetchable');
			if (mod?.default) {
				this.setFetchHandler(mod.default);
			}
		} catch {
			// If the virtual module fails to load (e.g. no src/app.ts),
			// the DefaultFetchHandler remains in place.
		}
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

	/**
	 * Clears the cached middleware so it is re-resolved on the next request.
	 * Called via HMR when middleware files change.
	 */
	clearMiddleware(): void {
		this.pipeline.clearMiddleware();
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
		logger: AstroLogger,
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
		logger: AstroLogger,
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

	/**
	 * Handle a request.
	 * @returns The return value indicates whether or not the request was handled
	 * by this handler. If the result is not `true`, then the request has not
	 * been handled yet and other handlers can be run.
	 */
	public async handleRequest({
		controller,
		incomingRequest,
		incomingResponse,
		isHttps,
		prerenderOnly,
	}: HandleRequest): Promise<boolean> {
		// Build a basic origin from the socket protocol and Host header.
		// X-Forwarded-* headers are resolved later inside FetchState, which
		// validates them against allowedDomains and updates the URL. This
		// lets user-provided fetch handlers (src/app.ts) set or modify
		// forwarded headers before FetchState picks them up.
		const protocol = isHttps ? 'https' : 'http';
		const host =
			(incomingRequest.headers[':authority'] as string | undefined) ?? incomingRequest.headers.host;

		const origin = `${protocol}://${host}`;
		const url = new URL(origin + incomingRequest.url);
		let pathname: string;
		if (this.manifest.trailingSlash === 'never' && !incomingRequest.url) {
			pathname = '';
		} else {
			// We already have a middleware that checks if there's an incoming URL that has invalid URI, so it's safe
			// to not handle the error: packages/astro/src/vite-plugin-astro-server/base.ts
			pathname = decodeURI(url.pathname);
		}

		// Add config.base back to url before passing it to SSR
		url.pathname = removeTrailingForwardSlash(this.manifest.base) + url.pathname;
		if (
			url.pathname.endsWith('/') &&
			!shouldAppendForwardSlash(this.manifest.trailingSlash, this.manifest.buildFormat)
		) {
			url.pathname = url.pathname.slice(0, -1);
		}

		const self = this;
		await self.#loadFetchHandler();

		let handled = true;
		await runWithErrorHandling({
			controller,
			pathname,
			async run() {
				const matchedRoute = await self.devMatch(pathname);
				if (!matchedRoute) {
					if (prerenderOnly) {
						// In prerender-only mode, signal that we didn't handle this
						// so the caller can fall through to the SSR handler.
						handled = false;
						return;
					}
					// This should never happen, because ensure404Route will add a 404 route if none exists.
					throw new Error('No route matched, and default 404 route was not found.');
				}

				// When running as the prerender handler, only handle prerendered routes.
				// If the best-matching route is SSR, let the SSR handler handle it instead.
				if (prerenderOnly && !matchedRoute.routeData.prerender) {
					handled = false;
					return;
				}

				// Delay reading the request body until prerenderOnly routing has decided
				// this handler really owns the request. Otherwise a prerender pass that
				// falls through to SSR would exhaust the body stream first.
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
		return handled;
	}

	match(request: Request, _allowPrerenderedRoutes: boolean): RouteData | undefined {
		return super.match(request, true);
	}

	protected createErrorHandler(): ErrorHandler {
		return new DevErrorHandler(this, { shouldInjectCspMetaTags: true });
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
	/** When true, only handle prerendered routes. Returns false for SSR routes. */
	prerenderOnly?: boolean;
};
