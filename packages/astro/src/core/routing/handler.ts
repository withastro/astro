import {
	appendForwardSlash,
	collapseDuplicateTrailingSlashes,
	hasFileExtension,
	isInternalPath,
	removeTrailingForwardSlash,
} from '@astrojs/internal-helpers/path';
import {
	DEFAULT_404_COMPONENT,
	REROUTABLE_STATUS_CODES,
	REROUTE_DIRECTIVE_HEADER,
	REWRITE_DIRECTIVE_HEADER_KEY,
} from '../constants.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { redirectTemplate } from './3xx.js';
import { routeHasHtmlExtension } from './helpers.js';
import { type CacheLike, applyCacheHeaders } from '../cache/runtime/cache.js';
import { type AstroSession, PERSIST_SYMBOL } from '../session/runtime.js';
import { getRenderOptions } from '../app/render-options.js';
import { prepareResponse } from '../app/prepare-response.js';
import type { BaseApp, ResolvedRenderOptions } from '../app/base.js';

export class AstroHandler {
	#app: BaseApp<any>;

	constructor(app: BaseApp<any>) {
		this.#app = app;
	}

	private redirectTrailingSlash(pathname: string): string {
		const { trailingSlash } = this.#app.manifest;

		// Ignore root and internal paths
		if (pathname === '/' || isInternalPath(pathname)) {
			return pathname;
		}

		// Redirect multiple trailing slashes to collapsed path
		const path = collapseDuplicateTrailingSlashes(pathname, trailingSlash !== 'never');
		if (path !== pathname) {
			return path;
		}

		if (trailingSlash === 'ignore') {
			return pathname;
		}

		if (trailingSlash === 'always' && !hasFileExtension(pathname)) {
			return appendForwardSlash(pathname);
		}
		if (trailingSlash === 'never') {
			return removeTrailingForwardSlash(pathname);
		}

		return pathname;
	}

	async handle(request: Request): Promise<Response> {
		const options = getRenderOptions(request);
		const addCookieHeader = options?.addCookieHeader ?? false;
		const clientAddress = options?.clientAddress;
		const locals = options?.locals;
		const prerenderedErrorPageFetch = options?.prerenderedErrorPageFetch ?? fetch;
		let routeData = options?.routeData;

		const timeStart = performance.now();
		const url = new URL(request.url);
		const redirect = this.redirectTrailingSlash(url.pathname);

		if (redirect !== url.pathname) {
			const status = request.method === 'GET' ? 301 : 308;
			const response = new Response(
				redirectTemplate({
					status,
					relativeLocation: url.pathname,
					absoluteLocation: redirect,
					from: request.url,
				}),
				{
					status,
					headers: {
						location: redirect + url.search,
					},
				},
			);
			prepareResponse(response, { addCookieHeader });
			return response;
		}

		if (routeData) {
			this.#app.logger.debug(
				'router',
				'The adapter ' + this.#app.manifest.adapterName + ' provided a custom RouteData for ',
				request.url,
			);
			this.#app.logger.debug('router', 'RouteData');
			this.#app.logger.debug('router', routeData);
		}

		const resolvedRenderOptions: ResolvedRenderOptions = {
			addCookieHeader,
			clientAddress,
			prerenderedErrorPageFetch,
			locals,
			routeData,
		};

		if (locals) {
			if (typeof locals !== 'object') {
				const error = new AstroError(AstroErrorData.LocalsNotAnObject);
				this.#app.logger.error(null, error.stack!);
				return this.#app.renderError(request, {
					...resolvedRenderOptions,
					// If locals are invalid, we don't want to include them when
					// rendering the error page
					locals: undefined,
					status: 500,
					error,
				});
			}
		}
		if (!routeData) {
			if (this.#app.isDev()) {
				const result = await this.#app.devMatch(this.#app.getPathnameFromRequest(request));
				if (result) {
					routeData = result.routeData;
				}
			} else {
				routeData = this.#app.match(request);
			}

			this.#app.logger.debug('router', 'Astro matched the following route for ' + request.url);
			this.#app.logger.debug('router', 'RouteData:\n' + routeData);
		}
		// At this point we haven't found a route that matches the request, so we create
		// a "fake" 404 route, so we can call the RenderContext.render
		// and hit the middleware, which might be able to return a correct Response.
		if (!routeData) {
			routeData = this.#app.manifestData.routes.find(
				(route) => route.component === '404.astro' || route.component === DEFAULT_404_COMPONENT,
			);
		}
		if (!routeData) {
			this.#app.logger.debug('router', "Astro hasn't found routes that match " + request.url);
			this.#app.logger.debug('router', "Here's the available routes:\n", this.#app.manifestData);
			return this.#app.renderError(request, {
				...resolvedRenderOptions,
				status: 404,
			});
		}
		let pathname = this.#app.getPathnameFromRequest(request);
		// In dev, the route may have matched a normalized pathname (after .html stripping).
		// Skip normalization if the route already has an .html extension in its definition.
		if (this.#app.isDev() && !routeHasHtmlExtension(routeData)) {
			pathname = pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
		}
		const defaultStatus = this.#app.getDefaultStatusCode(routeData, pathname);

		let response;
		let session: AstroSession | undefined;
		let cache: CacheLike | undefined;
		try {
			// Load route module. We also catch its error here if it fails on initialization
			const componentInstance = await this.#app.pipeline.getComponentByRoute(routeData);
			const renderContext = await this.#app.createRenderContext({
				pipeline: this.#app.pipeline,
				locals,
				pathname,
				request,
				routeData,
				status: defaultStatus,
				clientAddress,
			});
			session = renderContext.session;
			cache = renderContext.cache;

			if (this.#app.pipeline.cacheProvider) {
				// If the cache provider has an onRequest handler (runtime caching),
				// wrap the render call so the provider can serve from cache
				const cacheProvider = await this.#app.pipeline.getCacheProvider();
				if (cacheProvider?.onRequest) {
					response = await cacheProvider.onRequest(
						{
							request,
							url: new URL(request.url),
						},
						async () => {
							const res = await renderContext.render(componentInstance);
							// Apply cache headers before the provider reads them
							applyCacheHeaders(cache!, res);
							return res;
						},
					);
					// Strip CDN headers after the runtime provider has read them
					response.headers.delete('CDN-Cache-Control');
					response.headers.delete('Cache-Tag');
				} else {
					response = await renderContext.render(componentInstance);
					// Apply cache headers for CDN-based providers (no onRequest)
					applyCacheHeaders(cache!, response);
				}
			} else {
				response = await renderContext.render(componentInstance);
			}

			const isRewrite = response.headers.has(REWRITE_DIRECTIVE_HEADER_KEY);

			this.#app.logThisRequest({
				pathname,
				method: request.method,
				statusCode: response.status,
				isRewrite,
				timeStart,
			});
		} catch (err: any) {
			this.#app.logger.error(null, err.stack || err.message || String(err));
			return this.#app.renderError(request, {
				...resolvedRenderOptions,
				status: 500,
				error: err,
			});
		} finally {
			await session?.[PERSIST_SYMBOL]();
		}

		if (
			REROUTABLE_STATUS_CODES.includes(response.status) &&
			// If the body isn't null, that means the user sets the 404 status
			// but uses the current route to handle the 404
			response.body === null &&
			response.headers.get(REROUTE_DIRECTIVE_HEADER) !== 'no'
		) {
			return this.#app.renderError(request, {
				...resolvedRenderOptions,
				response,
				status: response.status as 404 | 500,
				// We don't have an error to report here. Passing null means we pass nothing intentionally
				// while undefined means there's no error
				error: response.status === 500 ? null : undefined,
			});
		}

		prepareResponse(response, { addCookieHeader });
		return response;
	}
}
