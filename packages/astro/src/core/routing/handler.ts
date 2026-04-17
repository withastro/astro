import {
	REROUTABLE_STATUS_CODES,
	REROUTE_DIRECTIVE_HEADER,
	REWRITE_DIRECTIVE_HEADER_KEY,
} from '../constants.js';
import { TrailingSlashHandler } from './trailing-slash-handler.js';
import { type CacheLike, applyCacheHeaders } from '../cache/runtime/cache.js';
import { I18n } from '../i18n/handler.js';
import { AstroMiddleware } from '../middleware/astro-middleware.js';
import { PagesHandler } from '../pages/handler.js';
import { Redirects } from '../redirects/handler.js';
import { type AstroSession, PERSIST_SYMBOL } from '../session/runtime.js';
import { FetchState } from '../app/fetch-state.js';
import { prepareResponse } from '../app/prepare-response.js';
import type { BaseApp } from '../app/base.js';

export class AstroHandler {
	#app: BaseApp<any>;
	#trailingSlashHandler: TrailingSlashHandler;
	#astroMiddleware: AstroMiddleware;
	#pagesHandler: PagesHandler;
	#redirects: Redirects;
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
		this.#redirects = new Redirects();
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

	async handle(request: Request): Promise<Response> {
		const trailingSlashRedirect = this.#trailingSlashHandler.handle(request);
		if (trailingSlashRedirect) {
			return trailingSlashRedirect;
		}

		const state = new FetchState(this.#app, request);

		if (!(await state.validateRouteData())) {
			return this.#app.renderError(request, {
				...state.renderOptions,
				status: 404,
				pathname: state.pathname,
			});
		}

		return this.render(state);
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
			session = renderContext.session;
			cache = renderContext.cache;

			// Redirect routes short-circuit the pipeline: no middleware, no
			// page dispatch, no i18n post-processing. `Redirects.handle`
			// returns `undefined` synchronously for non-redirect routes, so
			// we only `await` when we actually need to.
			const redirectPromise = this.#redirects.handle(renderContext);
			if (redirectPromise) {
				const redirectResponse = await redirectPromise;
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
				let res = await this.#astroMiddleware.handle(
					renderContext,
					componentInstance,
					{},
					renderRouteCallback,
				);
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
