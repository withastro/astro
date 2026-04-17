import {
	REROUTABLE_STATUS_CODES,
	REROUTE_DIRECTIVE_HEADER,
	REWRITE_DIRECTIVE_HEADER_KEY,
} from '../constants.js';
import { TrailingSlashHandler } from './trailing-slash-handler.js';
import { copyRequest, setOriginPathname } from './rewrite.js';
import { type CacheLike, applyCacheHeaders } from '../cache/runtime/cache.js';
import { AstroError } from '../errors/errors.js';
import { ForbiddenRewrite } from '../errors/errors-data.js';
import { AstroMiddleware } from '../middleware/astro-middleware.js';
import { PagesHandler } from '../pages/handler.js';
import { type AstroSession, PERSIST_SYMBOL } from '../session/runtime.js';
import { FetchState } from '../app/fetch-state.js';
import { prepareResponse } from '../app/prepare-response.js';
import type { BaseApp } from '../app/base.js';
import type { RewritePayload } from '../../types/public/common.js';

export class AstroHandler {
	#app: BaseApp<any>;
	#trailingSlashHandler: TrailingSlashHandler;
	#astroMiddleware: AstroMiddleware;
	#pagesHandler: PagesHandler;

	constructor(app: BaseApp<any>) {
		this.#app = app;
		this.#trailingSlashHandler = new TrailingSlashHandler(app);
		this.#astroMiddleware = new AstroMiddleware(app.pipeline);
		this.#pagesHandler = new PagesHandler(app.pipeline);
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
	 * This is the recursive entry point for rewrites: `Astro.rewrite(...)`
	 * mutates the `state` (routeData, request, pathname) and calls
	 * `render(state)` again to produce the new response. The mutable
	 * `FetchState` preserves per-request concerns (locals, cookies via the
	 * RenderContext, session) across rewrites.
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
			// Route user-triggered rewrites (Astro.rewrite / ctx.rewrite) back
			// through this handler so they get a fresh render context while
			// preserving FetchState (locals, renderOptions).
			renderContext.rewriteOverride = (payload) => this.#rewriteAndRender(state, payload);
			session = renderContext.session;
			cache = renderContext.cache;

			const renderRouteCallback = this.#pagesHandler.handle.bind(this.#pagesHandler);
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
							const res = await this.#astroMiddleware.handle(
								renderContext,
								componentInstance,
								{},
								renderRouteCallback,
							);
							// Apply cache headers before the provider reads them
							applyCacheHeaders(cache!, res);
							return res;
						},
					);
					// Strip CDN headers after the runtime provider has read them
					response.headers.delete('CDN-Cache-Control');
					response.headers.delete('Cache-Tag');
				} else {
					response = await this.#astroMiddleware.handle(
						renderContext,
						componentInstance,
						{},
						renderRouteCallback,
					);
					// Apply cache headers for CDN-based providers (no onRequest)
					applyCacheHeaders(cache!, response);
				}
			} else {
				response = await this.#astroMiddleware.handle(
					renderContext,
					componentInstance,
					{},
					renderRouteCallback,
				);
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

	/**
	 * Resolves the rewrite target, mutates `state` to point at the new
	 * route, and recursively invokes `render(state)` to produce the new
	 * response.
	 *
	 * Called as the `rewriteOverride` on the current request's
	 * `RenderContext` — see `AstroHandler.render`.
	 */
	async #rewriteAndRender(state: FetchState, payload: RewritePayload): Promise<Response> {
		const pipeline = this.#app.pipeline;
		pipeline.logger.debug('router', 'Calling rewrite: ', payload);
		const oldPathname = state.pathname;
		const previousRouteData = state.routeData;
		const { routeData, newUrl, pathname } = await pipeline.tryRewrite(payload, state.request);

		// This is a case where the user tries to rewrite from a SSR route to a prerendered route (SSG).
		// This case isn't valid because when building for SSR, the prerendered route disappears from the server output because it becomes an HTML file,
		// so Astro can't retrieve it from the emitted manifest.
		// Allow i18n fallback rewrites - if the target route has fallback routes, this is likely an i18n scenario
		const isI18nFallback = routeData.fallbackRoutes && routeData.fallbackRoutes.length > 0;
		if (
			pipeline.manifest.serverLike &&
			previousRouteData &&
			!previousRouteData.prerender &&
			routeData.prerender &&
			!isI18nFallback
		) {
			throw new AstroError({
				...ForbiddenRewrite,
				message: ForbiddenRewrite.message(state.pathname, pathname, routeData.component),
				hint: ForbiddenRewrite.hint(routeData.component),
			});
		}

		state.routeData = routeData;
		if (payload instanceof Request) {
			state.request = payload;
		} else {
			state.request = copyRequest(
				newUrl,
				state.request,
				// need to send the flag of the previous routeData
				routeData.prerender,
				pipeline.logger,
				routeData.route,
			);
		}
		state.pathname = pathname;
		setOriginPathname(
			state.request,
			oldPathname,
			pipeline.manifest.trailingSlash,
			pipeline.manifest.buildFormat,
		);
		return this.render(state);
	}
}
