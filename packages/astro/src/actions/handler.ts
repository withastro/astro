import type { RenderContext } from '../core/render-context.js';
import { getActionContext, serializeActionResult } from './runtime/server.js';

/**
 * Handles Astro Action requests in both modes:
 *
 * - **RPC**: POST requests to `/_actions/<name>` (originating from the
 *   generated JS client). Runs the action and returns the serialized result
 *   as the response.
 * - **Form**: POST requests with `?_action=<name>` targeting a page route
 *   (originating from an HTML `<form action={actions.foo}>`). Runs the
 *   action, stashes the result into `locals._actionPayload`, and returns
 *   `undefined` so the pipeline continues to render the page.
 *
 * Non-action requests are a no-op (`undefined`).
 */
export class ActionHandler {
	/**
	 * Run action handling for the given render context.
	 *
	 * Returns a `Response` when the action fully handles the request (RPC),
	 * or `undefined` when the caller should continue processing the
	 * request (form actions or non-action requests).
	 */
	async handle(renderContext: RenderContext): Promise<Response | undefined> {
		const actionApiContext = renderContext.createActionAPIContext();
		const apiContext = renderContext.createAPIContext({}, actionApiContext);

		const { action, setActionResult } = getActionContext(apiContext);
		if (!action || apiContext.isPrerendered) {
			return undefined;
		}

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

		// Form action: stash the result in locals and let the pipeline continue
		// to render the page. A subsequent call to `getActionContext` during
		// page rendering will see the stored payload and skip re-running.
		setActionResult(action.name, serialized);
		return undefined;
	}
}
