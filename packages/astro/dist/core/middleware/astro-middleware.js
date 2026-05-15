import { PipelineFeatures } from '../base-pipeline.js';
import { ROUTE_TYPE_HEADER } from '../constants.js';
import { attachCookiesToResponse } from '../cookies/index.js';
import { applyRewriteToState } from '../rewrites/handler.js';
import { callMiddleware } from './callMiddleware.js';
import { sequence } from './index.js';
class AstroMiddleware {
	#pipeline;
	constructor(pipeline) {
		this.#pipeline = pipeline;
	}
	async handle(state, renderRouteCallback) {
		state.pipeline.usedFeatures |= PipelineFeatures.middleware;
		const pipeline = this.#pipeline;
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
		const next = async (ctx, payload) => {
			if (payload) {
				pipeline.logger.debug('router', 'Called rewriting to:', payload);
				const result = await pipeline.tryRewrite(payload, state.request);
				applyRewriteToState(state, payload, result);
			}
			return renderRouteCallback(state, ctx);
		};
		let response;
		if (state.skipMiddleware) {
			response = await next(apiContext);
		} else {
			const pipelineMiddleware = await pipeline.getMiddleware();
			const composed = sequence(...pipeline.internalMiddleware, pipelineMiddleware);
			response = await callMiddleware(composed, apiContext, next);
		}
		return this.#finalize(state, response);
	}
	#finalize(state, response) {
		if (response.headers.get(ROUTE_TYPE_HEADER)) {
			response.headers.delete(ROUTE_TYPE_HEADER);
		}
		attachCookiesToResponse(response, state.cookies);
		return response;
	}
}
export { AstroMiddleware };
