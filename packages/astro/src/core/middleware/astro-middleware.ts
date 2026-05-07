import type { FetchState } from '../fetch/fetch-state.js';
import type { RewritePayload } from '../../types/public/common.js';
import type { APIContext } from '../../types/public/context.js';
import { type Pipeline, PipelineFeatures } from '../base-pipeline.js';
import { ROUTE_TYPE_HEADER } from '../constants.js';
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
		return this.#finalize(state, response);
	}

	#finalize(state: FetchState, response: Response): Response {
		if (response.headers.get(ROUTE_TYPE_HEADER)) {
			response.headers.delete(ROUTE_TYPE_HEADER);
		}
		// LEGACY: we put cookies on the response object,
		// where the adapter might be expecting to read it.
		// New code should be using `app.render({ addCookieHeader: true })` instead.
		attachCookiesToResponse(response, state.cookies!);
		return response;
	}
}
