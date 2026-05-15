import type { BaseApp } from '../app/base.js';
import type { Pipeline } from '../base-pipeline.js';
import type { FetchState } from '../fetch/fetch-state.js';
/**
 * Handles trailing-slash normalization for incoming requests. If the
 * request's pathname does not match the app's configured `trailingSlash`
 * policy, a redirect response is returned. Otherwise, returns `undefined`
 * so the caller can continue processing the request.
 */
export declare class TrailingSlashHandler {
	#private;
	constructor(app: BaseApp<Pipeline>);
	/**
	 * Returns a redirect `Response` if the request pathname needs
	 * normalization, or `undefined` if no redirect is required.
	 */
	handle(state: FetchState): Response | undefined;
}
