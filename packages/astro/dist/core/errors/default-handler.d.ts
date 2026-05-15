import type { BaseApp, RenderErrorOptions } from '../app/base.js';
import type { Pipeline } from '../base-pipeline.js';
import type { ErrorHandler } from './handler.js';
/**
 * The default error handler used in production SSR. Attempts to render the
 * matching error route (404.astro / 500.astro), falling back to a plain
 * response with the given status. Handles prerendered error pages via
 * `prerenderedErrorPageFetch`.
 */
export declare class DefaultErrorHandler implements ErrorHandler {
	#private;
	constructor(app: BaseApp<Pipeline>);
	renderError(
		request: Request,
		{
			status,
			response: originalResponse,
			skipMiddleware,
			error,
			pathname,
			...resolvedRenderOptions
		}: RenderErrorOptions,
	): Promise<Response>;
}
