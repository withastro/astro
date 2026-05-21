import { ActionHandler } from '../../actions/handler.js';
import type { APIContext } from '../../types/public/context.js';
import {
	REROUTABLE_STATUS_CODES,
	REROUTE_DIRECTIVE_HEADER,
	REWRITE_DIRECTIVE_HEADER_KEY,
} from '../constants.js';
import { TrailingSlashHandler } from './trailing-slash-handler.js';
import { CacheHandler, provideCache } from '../cache/handler.js';
import { I18n } from '../i18n/handler.js';
import { AstroMiddleware } from '../middleware/astro-middleware.js';
import { PagesHandler } from '../pages/handler.js';
import { renderRedirect } from '../redirects/render.js';
import { provideSession } from '../session/handler.js';
import type { FetchState } from '../fetch/fetch-state.js';
import { prepareResponse } from '../app/prepare-response.js';
import type { BaseApp } from '../app/base.js';
import { type Pipeline, PipelineFeatures } from '../base-pipeline.js';

export class AstroHandler {
	#app: BaseApp<Pipeline>;
	#trailingSlashHandler: TrailingSlashHandler;
	#actionHandler: ActionHandler;
	#astroMiddleware: AstroMiddleware;
	#pagesHandler: PagesHandler;
	#cacheHandler: CacheHandler;
	/** Bound callback for the middleware chain — created once, reused per request. */
	#renderRouteCallback: (state: FetchState, ctx: APIContext) => Promise<Response>;
	/**
	 * i18n post-processor. Only set when the app has i18n configured and
	 * the strategy is not `manual` — for the manual strategy users wire
	 * `astro:i18n.middleware(...)` into their own `onRequest`.
	 */
	#i18n: I18n | undefined;
	/** Whether sessions are configured on the manifest. */
	#hasSession: boolean;

	constructor(app: BaseApp<Pipeline>) {
		this.#app = app;
		this.#trailingSlashHandler = new TrailingSlashHandler(app);
		this.#actionHandler = new ActionHandler();
		this.#astroMiddleware = new AstroMiddleware(app.pipeline);
		this.#pagesHandler = new PagesHandler(app.pipeline);
		this.#cacheHandler = new CacheHandler(app);
		this.#renderRouteCallback = this.#actionsAndPages.bind(this);
		this.#hasSession = !!app.manifest.sessionConfig;
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

	/**
	 * Runs actions then pages — the callback at the bottom of the
	 * middleware chain. Bound once in the constructor to avoid
	 * per-request closure allocation.
	 */
	#actionsAndPages(state: FetchState, ctx: APIContext): Promise<Response> {
		if (!state.skipMiddleware) {
			const actionResult = this.#actionHandler.handle(ctx, state);
			if (actionResult) {
				return actionResult.then((response) => response ?? this.#pagesHandler.handle(state, ctx));
			}
		}
		return this.#pagesHandler.handle(state, ctx);
	}

	async handle(state: FetchState): Promise<Response> {
		const trailingSlashRedirect = this.#trailingSlashHandler.handle(state);
		if (trailingSlashRedirect) {
			return trailingSlashRedirect;
		}

		if (!state.routeData) {
			return this.#app.renderError(state.request, {
				...state.renderOptions,
				status: 404,
				pathname: state.pathname,
			});
		}

		return this.render(state);
	}

	/**
	 * Renders a response for the given `FetchState`. Assumes
	 * trailing-slash redirects and routeData resolution have already run.
	 *
	 * User-triggered rewrites (`Astro.rewrite` / `ctx.rewrite`) go through
	 * `Rewrites.execute` on the current `FetchState` — they mutate the
	 * existing state in place and re-run middleware + page dispatch.
	 */
	async render(state: FetchState): Promise<Response> {
		const routeData = state.routeData!;
		const pathname = state.pathname;
		const request = state.request;
		const { addCookieHeader } = state.renderOptions;
		const defaultStatus = this.#app.getDefaultStatusCode(routeData, pathname);
		state.status = defaultStatus;

		let response;
		try {
			// `provideCache` always runs so `Astro.cache` is defined even
			// when caching is disabled — it registers a no-op shim that
			// warns once on use. `provideSession` is gated because there
			// is no equivalent disabled-shim contract for sessions.
			const sessionP = this.#hasSession ? provideSession(state) : undefined;
			const cacheP = provideCache(state);
			if (sessionP || cacheP) await Promise.all([sessionP, cacheP]);
			// Track feature usage even when skipped.
			state.pipeline.usedFeatures |= PipelineFeatures.sessions;

			// Redirect routes short-circuit the pipeline: no middleware, no
			// page dispatch, no i18n post-processing. Inline routeData.type
			// check to avoid a per-request function call + object overhead.
			if (routeData.type === 'redirect') {
				const redirectResponse = await renderRedirect(state);
				this.#app.logThisRequest({
					pathname,
					method: request.method,
					statusCode: redirectResponse.status,
					isRewrite: false,
					timeStart: state.timeStart,
				});
				prepareResponse(redirectResponse, { addCookieHeader });
				this.#app.pipeline.logger.flush();
				return redirectResponse;
			}

			// When no cache provider is configured (the common case), run
			// the middleware + i18n pipeline directly without going through
			// the cache handler. This avoids a closure allocation and an
			// extra function call per request.
			if (!this.#app.pipeline.cacheProvider) {
				this.#app.pipeline.usedFeatures |= PipelineFeatures.cache;
				response = await this.#astroMiddleware.handle(state, this.#renderRouteCallback);
				if (this.#i18n) {
					response = await this.#i18n.finalize(state, response);
				}
			} else {
				const runPipeline = async (): Promise<Response> => {
					let res = await this.#astroMiddleware.handle(state, this.#renderRouteCallback);
					if (this.#i18n) {
						res = await this.#i18n.finalize(state, res);
					}
					return res;
				};
				response = await this.#cacheHandler.handle(state, runPipeline);
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
			const finalize = state.finalizeAll();
			if (finalize) await finalize;
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
		this.#app.pipeline.logger.flush();
		return response;
	}
}
