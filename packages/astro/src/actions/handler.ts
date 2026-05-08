import type { APIContext } from '../types/public/context.js';
import { PipelineFeatures } from '../core/base-pipeline.js';
import type { FetchState } from '../core/fetch/fetch-state.js';
import { getActionContext, serializeActionResult } from './runtime/server.js';

/**
 * Handles Astro Action requests in both modes:
 *
 * - **RPC**: POST requests to `/_actions/<name>` (originating from the
 *   generated JS client). Runs the action and returns the serialized result
 *   as the response, so the caller can short-circuit rendering.
 * - **Form**: POST requests with `?_action=<name>` targeting a page route
 *   (originating from an HTML `<form action={actions.foo}>`). Runs the
 *   action, stashes the result into `locals._actionPayload`, and returns
 *   `undefined` so the caller continues to render the page.
 *
 * Non-action requests are a no-op (`undefined`).
 *
 * This handler is invoked at the bottom of the middleware chain, before
 * page dispatch. That placement preserves the existing behavior where
 * user middleware sees action requests and response finalization (cookies,
 * sessions, etc.) runs around the action response.
 */
export class ActionHandler {
	/**
	 * Run action handling for the current request. Expects the APIContext
	 * that is already being used by the render pipeline.
	 *
	 * Returns a `Response` when the action fully handles the request (RPC),
	 * or `undefined` when the caller should continue processing the
	 * request (form actions or non-action requests).
	 */
	handle(apiContext: APIContext, state: FetchState): Promise<Response | undefined> | undefined {
		state.pipeline.usedFeatures |= PipelineFeatures.actions;
		if (apiContext.isPrerendered) {
			return undefined;
		}

		const { action, setActionResult } = getActionContext(apiContext);
		if (!action) {
			return undefined;
		}

		return this.#executeAction(action, setActionResult);
	}

	async #executeAction(
		action: ReturnType<typeof getActionContext>['action'],
		setActionResult: ReturnType<typeof getActionContext>['setActionResult'],
	): Promise<Response | undefined> {
		const actionResult = await action!.handler();
		const serialized = serializeActionResult(actionResult);

		if (action!.calledFrom === 'rpc') {
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

		// Form action: stash the result in locals and let the caller continue
		// to render the page. A subsequent call to `getActionContext` during
		// page rendering will see the stored payload and skip re-running.
		setActionResult(action!.name, serialized);
		return undefined;
	}
}
