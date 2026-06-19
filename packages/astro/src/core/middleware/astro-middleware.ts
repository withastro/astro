import type { FetchState } from '../fetch/fetch-state.js';
import type { RewritePayload } from '../../types/public/common.js';
import type { APIContext } from '../../types/public/context.js';
import type { BaseApp } from '../app/base.js';
import { type Pipeline, PipelineFeatures } from '../base-pipeline.js';
import { ASTRO_ERROR_HEADER } from '../constants.js';
import { attachCookiesToResponse } from '../cookies/index.js';
import { applyRewriteToState } from '../rewrites/handler.js';
import { callMiddleware } from './callMiddleware.js';
import { sequence } from './index.js';

/**
 * Callback invoked at the bottom of the middleware chain to dispatch the
 * request to the matched route (endpoint / redirect / page / fallback).
 *
 * Callers of `AstroMiddleware.handle` pass their owned `PagesHandler`'s
 * `handle` method (bound) so route dispatch logic stays out of the
 * middleware layer.
 */
export type RenderRouteCallback = (state: FetchState, ctx: APIContext) => Promise<Response>;

/**
 * Handles the execution of Astro's middleware chain (internal + user) for a
 * single render. Holds a reference to the `Pipeline` and composes the
 * internal and user middleware at render time.
 *
 * Reads per-request data (componentInstance, slots, props, API contexts)
 * off the supplied `FetchState`. The actual route dispatch (endpoint /
 * redirect / page / fallback) is supplied by the caller as
 * `renderRouteCallback` — typically bound to a `PagesHandler.handle`.
 */
export class AstroMiddleware {
	#pipeline: Pipeline;

	constructor(pipeline: Pipeline) {
		this.#pipeline = pipeline;
	}

	async handle(state: FetchState, renderRouteCallback: RenderRouteCallback): Promise<Response> {
		state.pipeline.usedFeatures |= PipelineFeatures.middleware;
		const pipeline = this.#pipeline;

		// Resolve props first (the async bit) so downstream consumers can
		// call `state.getAPIContext()` synchronously on the hot path.
		await state.getProps();
		const apiContext = state.getAPIContext();

		state.counter++;
		if (state.counter === 4) {
			return new Response('Loop Detected', {
				// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/508
				status: 508,
				statusText:
					'Astro detected a loop where you tried to call the rewriting logic more than four times.',
			});
		}

		const next = async (ctx: APIContext, payload?: RewritePayload) => {
			if (payload) {
				pipeline.logger.debug('router', 'Called rewriting to:', payload);
				const result = await pipeline.tryRewrite(payload, state.request);
				applyRewriteToState(state, payload, result);
			}
			return renderRouteCallback(state, ctx);
		};

		let response: Response;
		if (state.skipMiddleware) {
			response = await next(apiContext);
		} else {
			const pipelineMiddleware = await pipeline.getMiddleware();
			const composed = sequence(...pipeline.internalMiddleware, pipelineMiddleware);
			response = await callMiddleware(composed, apiContext, next);
		}
		response = this.#finalize(state, response);
		state.response = response;
		return response;
	}

	/**
	 * Like `handle`, but mirrors the app-level error handling that
	 * `AstroHandler` provides on the standard path, the same way
	 * `PagesHandler.handleWithErrorFallback` does for `pages()`. When no
	 * route matched it returns a 404 marked with `X-Astro-Error` for the
	 * app's post-check; when Astro's own middleware chain throws it logs the
	 * error and renders the custom `500.astro`.
	 *
	 * Errors surfaced through `renderRouteCallback` (the host framework's
	 * `next`, e.g. host middleware mounted below `middleware()`) are
	 * re-thrown instead, so the host's own error handling still runs rather
	 * than being swallowed into Astro's 500 page. A sentinel tells the two
	 * apart.
	 *
	 * Used by the composable `astro/fetch` `middleware()` entry point, where
	 * there is no surrounding `AstroHandler` to supply this fallback.
	 */
	async handleWithErrorFallback(
		app: BaseApp<Pipeline>,
		state: FetchState,
		renderRouteCallback: RenderRouteCallback,
	): Promise<Response> {
		// `FetchState` falls back to an SSR 404 route when nothing matches, so
		// routeData is only missing when the custom 404 page is prerendered (or
		// absent). Returning a marked 404 lets the app's `X-Astro-Error`
		// post-check render the 404 page a level up, mirroring
		// `PagesHandler.handleWithErrorFallback`; running user middleware here
		// would throw on the missing route (no component to load).
		if (!state.routeData) {
			return new Response(null, { status: 404, headers: { [ASTRO_ERROR_HEADER]: 'true' } });
		}
		let nextError: unknown;
		try {
			return await this.handle(state, async (s, ctx) => {
				try {
					return await renderRouteCallback(s, ctx);
				} catch (err) {
					nextError = err;
					throw err;
				}
			});
		} catch (err: any) {
			if (err === nextError) throw err;
			// User middleware threw: log the stack and render the custom 500
			// page, the same way `AstroHandler` does on the standard path.
			app.logger.error(null, err.stack || err.message || String(err));
			return app.renderError(state.request, {
				...state.renderOptions,
				status: 500,
				error: err,
				pathname: state.pathname,
			});
		}
	}

	#finalize(state: FetchState, response: Response): Response {
		// LEGACY: we put cookies on the response object,
		// where the adapter might be expecting to read it.
		// New code should be using `app.render({ addCookieHeader: true })` instead.
		attachCookiesToResponse(response, state.cookies!);
		return response;
	}
}
