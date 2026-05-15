import type { BaseApp, RenderErrorOptions } from '../app/base.js';
import type { Pipeline } from '../base-pipeline.js';
import type { ErrorHandler } from './handler.js';
export interface DevErrorHandlerOptions {
	/**
	 * Whether to inject CSP meta tags into the rendered error page response.
	 * The Vite dev server injects them; the non-runnable dev pipeline does not.
	 */
	shouldInjectCspMetaTags: boolean;
}
/**
 * The dev-server error handler. Renders custom 404/500 routes if the user
 * has them, otherwise throws so Vite's dev overlay is shown. Shared between
 * the Vite dev server (`AstroServerApp`) and the non-runnable dev pipeline
 * (`DevApp`); only `shouldInjectCspMetaTags` differs between them.
 */
export declare class DevErrorHandler implements ErrorHandler {
	#private;
	constructor(app: BaseApp<Pipeline>, options: DevErrorHandlerOptions);
	renderError(
		request: Request,
		{
			skipMiddleware,
			error,
			status,
			response: _response,
			pathname,
			...resolvedRenderOptions
		}: RenderErrorOptions,
	): Promise<Response>;
}
