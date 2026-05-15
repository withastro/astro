import type { BaseApp, ResolvedRenderOptions } from '../app/base.js';
import type { Pipeline } from '../base-pipeline.js';
import type { FetchHandler } from './types.js';
/**
 * The default request handler for `BaseApp`. Builds the per-request
 * `FetchState` and delegates to an `AstroHandler`.
 */
export declare class DefaultFetchHandler {
	#private;
	constructor(app?: BaseApp<Pipeline>);
	/**
	 * Fast path: called directly by `BaseApp.render()` with pre-resolved
	 * options, avoiding the `Reflect.set/get` round-trip through the request.
	 */
	renderWithOptions(request: Request, options: ResolvedRenderOptions): Promise<Response>;
	fetch: FetchHandler;
}
