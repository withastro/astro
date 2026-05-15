import type { BaseApp, RenderErrorOptions } from '../app/base.js';
import type { Pipeline } from '../base-pipeline.js';
import type { ErrorHandler } from './handler.js';
/**
 * The error handler used during static build / prerendering.
 *
 * - For 500 errors, returns the original response if present, otherwise
 *   throws so the build surfaces the underlying error to the developer.
 * - For other errors (e.g. 404), delegates to `DefaultErrorHandler` with
 *   `prerenderedErrorPageFetch` cleared (the build pipeline can't fetch
 *   prerendered pages the way production SSR can).
 */
export declare class BuildErrorHandler implements ErrorHandler {
	#private;
	constructor(app: BaseApp<Pipeline>);
	renderError(request: Request, options: RenderErrorOptions): Promise<Response>;
}
