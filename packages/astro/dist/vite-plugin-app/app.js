import { removeTrailingForwardSlash } from '@astrojs/internal-helpers/path';
import { BaseApp } from '../core/app/entrypoints/index.js';
import { getFirstForwardedValue, validateForwardedHeaders } from '../core/app/validate-headers.js';
import { shouldAppendForwardSlash } from '../core/build/util.js';
import { clientLocalsSymbol } from '../core/constants.js';
import { createSafeError } from '../core/errors/index.js';
import { DevErrorHandler } from '../core/errors/dev-handler.js';
import { createRequest } from '../core/request.js';
import { recordServerError } from '../vite-plugin-astro-server/error.js';
import { runWithErrorHandling } from '../vite-plugin-astro-server/index.js';
import { handle500Response, writeSSRResult } from '../vite-plugin-astro-server/response.js';
import { RunnablePipeline } from './pipeline.js';
import { ensure404Route } from '../core/routing/astro-designed-error-pages.js';
import { matchRoute } from '../core/routing/dev.js';
import { req } from '../core/messages/runtime.js';
class AstroServerApp extends BaseApp {
	settings;
	loader;
	manifestData;
	constructor(manifest, streaming = true, logger, manifestData, loader, settings, getDebugInfo) {
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
	async #loadFetchHandler() {
		try {
			const mod = await this.loader.import('virtual:astro:fetchable');
			if (mod?.default) {
				this.setFetchHandler(mod.default);
			}
		} catch {}
	}
	isDev() {
		return true;
	}
	/**
	 * Updates the routes list when files change during development.
	 * Called via HMR when new pages are added/removed.
	 */
	updateRoutes(newRoutesList) {
		this.manifestData = newRoutesList;
		this.pipeline.setManifestData(newRoutesList);
		ensure404Route(this.manifestData);
	}
	/**
	 * Clears the route cache so that getStaticPaths() is re-evaluated.
	 * Called via HMR when content collection data changes.
	 */
	clearRouteCache() {
		this.pipeline.clearRouteCache();
	}
	/**
	 * Clears the cached middleware so it is re-resolved on the next request.
	 * Called via HMR when middleware files change.
	 */
	clearMiddleware() {
		this.pipeline.clearMiddleware();
	}
	async devMatch(pathname) {
		const matchedRoute = await matchRoute(
			pathname,
			this.manifestData,
			this.pipeline,
			this.manifest,
		);
		if (!matchedRoute) {
			return void 0;
		}
		return {
			routeData: matchedRoute.route,
			resolvedPathname: matchedRoute.resolvedPathname,
		};
	}
	static async create(manifest, routesList, logger, loader, settings, getDebugInfo) {
		return new AstroServerApp(manifest, true, logger, routesList, loader, settings, getDebugInfo);
	}
	createPipeline(_streaming, manifest, settings, logger, loader, manifestData, getDebugInfo) {
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
	async handleRequest({ controller, incomingRequest, incomingResponse, isHttps, prerenderOnly }) {
		const validated = validateForwardedHeaders(
			getFirstForwardedValue(incomingRequest.headers['x-forwarded-proto']),
			getFirstForwardedValue(incomingRequest.headers['x-forwarded-host']),
			getFirstForwardedValue(incomingRequest.headers['x-forwarded-port']),
			this.manifest.allowedDomains,
		);
		const protocol = validated.protocol ?? (isHttps ? 'https' : 'http');
		const host =
			validated.host ?? incomingRequest.headers[':authority'] ?? incomingRequest.headers.host;
		const origin = `${protocol}://${host}`;
		const url = new URL(origin + incomingRequest.url);
		let pathname;
		if (this.manifest.trailingSlash === 'never' && !incomingRequest.url) {
			pathname = '';
		} else {
			pathname = decodeURI(url.pathname);
		}
		url.pathname = removeTrailingForwardSlash(this.manifest.base) + url.pathname;
		if (
			url.pathname.endsWith('/') &&
			!shouldAppendForwardSlash(this.manifest.trailingSlash, this.manifest.buildFormat)
		) {
			url.pathname = url.pathname.slice(0, -1);
		}
		let body = void 0;
		if (!(incomingRequest.method === 'GET' || incomingRequest.method === 'HEAD')) {
			let bytes = [];
			await new Promise((resolve) => {
				incomingRequest.on('data', (part) => {
					bytes.push(part);
				});
				incomingRequest.on('end', resolve);
			});
			body = Buffer.concat(bytes);
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
						handled = false;
						return;
					}
					throw new Error('No route matched, and default 404 route was not found.');
				}
				if (prerenderOnly && !matchedRoute.routeData.prerender) {
					handled = false;
					return;
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
				const locals = Reflect.get(incomingRequest, clientLocalsSymbol);
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
	match(request, _allowPrerenderedRoutes) {
		return super.match(request, true);
	}
	createErrorHandler() {
		return new DevErrorHandler(this, { shouldInjectCspMetaTags: true });
	}
	logRequest({ pathname, method, statusCode, isRewrite, reqTime }) {
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
export { AstroServerApp };
