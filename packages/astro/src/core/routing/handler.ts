import {
	DEFAULT_404_COMPONENT,
	REROUTABLE_STATUS_CODES,
	REROUTE_DIRECTIVE_HEADER,
	REWRITE_DIRECTIVE_HEADER_KEY,
} from '../constants.js';
import { TrailingSlashHandler } from './trailing-slash-handler.js';
import { type CacheLike, applyCacheHeaders } from '../cache/runtime/cache.js';
import { I18n } from '../i18n/handler.js';
import { AstroMiddleware } from '../middleware/astro-middleware.js';
import { PagesHandler } from '../pages/handler.js';
import { renderRedirect } from '../redirects/render.js';
import { type AstroSession, PERSIST_SYMBOL } from '../session/runtime.js';
import type { FetchState } from '../app/fetch-state.js';
import { prepareResponse } from '../app/prepare-response.js';
import type { BaseApp } from '../app/base.js';
import { routeHasHtmlExtension } from './helpers.js';

export class AstroHandler {
	#app: BaseApp<any>;
	#trailingSlashHandler: TrailingSlashHandler;
	#astroMiddleware: AstroMiddleware;
	#pagesHandler: PagesHandler;
	/**
	 * i18n post-processor. Only set when the app has i18n configured and
	 * the strategy is not `manual` — for the manual strategy users wire
	 * `astro:i18n.middleware(...)` into their own `onRequest`.
	 */
	#i18n: I18n | undefined;

	constructor(app: BaseApp<any>) {
		this.#app = app;
		this.#trailingSlashHandler = new TrailingSlashHandler(app);
		this.#astroMiddleware = new AstroMiddleware(app.pipeline);
		this.#pagesHandler = new PagesHandler(app.pipeline);
		const i18n = app.manifest.i18n;
		if (i18n && i18n.strategy !== 'manual') {
			this.#i18n = new I18n(
				i18n,
				app.manifest.base,
				app.manifest.trailingSlash,
				app.manifest.buildFormat,
			);
		}
	}

	async handle(state: FetchState): Promise<Response> {
		const trailingSlashRedirect = this.#trailingSlashHandler.handle(state.request);
		if (trailingSlashRedirect) {
			return trailingSlashRedirect;
		}

		if (!(await this.#resolveRouteData(state))) {
			return this.#app.renderError(state.request, {
				...state.renderOptions,
				status: 404,
				pathname: state.pathname,
			});
		}

		return this.render(state);
	}

	/**
	 * Resolves the route to use for this request and stores it on
	 * `state.routeData`. If the adapter provided a `routeData` via render
	 * options it's used as-is. Otherwise we try the app's route matcher
	 * (dev or prod) and fall back to a `404.astro` route so middleware can
	 * still run.
	 *
	 * Once routeData is known, finalize `state.pathname`: in dev, if the
	 * matched route has no `.html` extension, strip `.html` / `/index.html`
	 * suffixes so the render context sees the canonical pathname.
	 *
	 * Returns `true` when `state.routeData` is populated, or `false` when
	 * no route could be found (the caller should render a 404 error page).
	 */
	async #resolveRouteData(state: FetchState): Promise<boolean> {
		const app = this.#app;
		const request = state.request;

		if (!state.routeData) {
			if (app.isDev()) {
				const result = await app.devMatch(state.pathname);
				if (result) {
					state.routeData = result.routeData;
				}
			} else {
				state.routeData = app.match(request);
			}

			app.logger.debug('router', 'Astro matched the following route for ' + request.url);
			app.logger.debug('router', 'RouteData:\n' + state.routeData);
		}
		// At this point we haven't found a route that matches the request, so we create
		// a "fake" 404 route, so we can call the RenderContext.render
		// and hit the middleware, which might be able to return a correct Response.
		if (!state.routeData) {
			state.routeData = app.manifestData.routes.find(
				(route) => route.component === '404.astro' || route.component === DEFAULT_404_COMPONENT,
			);
		}
		if (!state.routeData) {
			app.logger.debug('router', "Astro hasn't found routes that match " + request.url);
			app.logger.debug('router', "Here's the available routes:\n", app.manifestData);
			return false;
		}
		// In dev, the route may have matched a normalized pathname (after .html stripping).
		// Skip normalization if the route already has an .html extension in its definition.
		if (app.isDev() && !routeHasHtmlExtension(state.routeData)) {
			state.pathname = state.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
		}
		return true;
	}

	/**
	 * Renders a response for the given `FetchState`. Assumes trailing-slash
	 * redirects and routeData resolution have already run.
	 *
	 * User-triggered rewrites (`Astro.rewrite` / `ctx.rewrite`) go through
	 * `Rewrites.execute` on the current `RenderContext` — they mutate the
	 * existing context in place and re-run middleware + page dispatch.
	 */
	async render(state: FetchState): Promise<Response> {
		const routeData = state.routeData!;
		const pathname = state.pathname;
		const request = state.request;
		const { addCookieHeader, clientAddress, locals } = state.renderOptions;
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
			state.renderContext = renderContext;
			state.componentInstance = componentInstance;
			renderContext.fetchState = state;
			session = renderContext.session;
			cache = renderContext.cache;

			// Redirect routes short-circuit the pipeline: no middleware, no
			// page dispatch, no i18n post-processing. Inline routeData.type
			// check to avoid a per-request function call + object overhead.
			if (routeData.type === 'redirect') {
				const redirectResponse = await renderRedirect(renderContext);
				this.#app.logThisRequest({
					pathname,
					method: request.method,
					statusCode: redirectResponse.status,
					isRewrite: false,
					timeStart: state.timeStart,
				});
				prepareResponse(redirectResponse, { addCookieHeader });
				return redirectResponse;
			}

			const renderRouteCallback = this.#pagesHandler.handle.bind(this.#pagesHandler);
			// Run middleware + (optional) i18n post-processing together so
			// that any cache wrapping sees the final response.
			const runPipeline = async (): Promise<Response> => {
				let res = await this.#astroMiddleware.handle(state, renderRouteCallback);
				if (this.#i18n) {
					res = await this.#i18n.finalize(state.request, res, {
						redirect: (location, status) =>
							new Response(null, { status, headers: { Location: location } }),
						rewrite: (path) => renderContext.rewrite(path),
						currentLocale: renderContext.computeCurrentLocale(),
						isPrerendered: renderContext.routeData.prerender,
					});
				}
				return res;
			};

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
							const res = await runPipeline();
							// Apply cache headers before the provider reads them
							applyCacheHeaders(cache!, res);
							return res;
						},
					);
					// Strip CDN headers after the runtime provider has read them
					response.headers.delete('CDN-Cache-Control');
					response.headers.delete('Cache-Tag');
				} else {
					response = await runPipeline();
					// Apply cache headers for CDN-based providers (no onRequest)
					applyCacheHeaders(cache!, response);
				}
			} else {
				response = await runPipeline();
			}

			const isRewrite = response.headers.has(REWRITE_DIRECTIVE_HEADER_KEY);

			this.#app.logThisRequest({
				pathname,
				method: request.method,
				statusCode: response.status,
				isRewrite,
				timeStart: state.timeStart,
			});
		} catch (err: any) {
			this.#app.logger.error(null, err.stack || err.message || String(err));
			return this.#app.renderError(request, {
				...state.renderOptions,
				status: 500,
				error: err,
				pathname: state.pathname,
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
				...state.renderOptions,
				response,
				status: response.status as 404 | 500,
				// We don't have an error to report here. Passing null means we pass nothing intentionally
				// while undefined means there's no error
				error: response.status === 500 ? null : undefined,
				pathname: state.pathname,
			});
		}

		prepareResponse(response, { addCookieHeader });
		return response;
	}
}
