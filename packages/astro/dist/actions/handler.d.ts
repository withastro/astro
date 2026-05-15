import type { APIContext } from '../types/public/context.js';
import type { FetchState } from '../core/fetch/fetch-state.js';
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
export declare class ActionHandler {
	#private;
	/**
	 * Run action handling for the current request. Expects the APIContext
	 * that is already being used by the render pipeline.
	 *
	 * Returns a `Response` when the action fully handles the request (RPC),
	 * or `undefined` when the caller should continue processing the
	 * request (form actions or non-action requests).
	 */
	handle(apiContext: APIContext, state: FetchState): Promise<Response | undefined> | undefined;
}
