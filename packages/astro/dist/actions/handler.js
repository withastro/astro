import { PipelineFeatures } from '../core/base-pipeline.js';
import { getActionContext, serializeActionResult } from './runtime/server.js';
class ActionHandler {
	/**
	 * Run action handling for the current request. Expects the APIContext
	 * that is already being used by the render pipeline.
	 *
	 * Returns a `Response` when the action fully handles the request (RPC),
	 * or `undefined` when the caller should continue processing the
	 * request (form actions or non-action requests).
	 */
	handle(apiContext, state) {
		state.pipeline.usedFeatures |= PipelineFeatures.actions;
		if (apiContext.isPrerendered) {
			return void 0;
		}
		const { action, setActionResult } = getActionContext(apiContext);
		if (!action) {
			return void 0;
		}
		return this.#executeAction(action, setActionResult);
	}
	async #executeAction(action, setActionResult) {
		const actionResult = await action.handler();
		const serialized = serializeActionResult(actionResult);
		if (action.calledFrom === 'rpc') {
			if (serialized.type === 'empty') {
				return new Response(null, {
					status: serialized.status,
				});
			}
			return new Response(serialized.body, {
				status: serialized.status,
				headers: {
					'Content-Type': serialized.contentType,
				},
			});
		}
		setActionResult(action.name, serialized);
		return void 0;
	}
}
export { ActionHandler };
