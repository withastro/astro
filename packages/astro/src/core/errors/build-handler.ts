import type { BaseApp, RenderErrorOptions } from '../app/base.js';
import type { Pipeline } from '../base-pipeline.js';
import { DefaultErrorHandler } from './default-handler.js';
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
export class BuildErrorHandler implements ErrorHandler {
	#default: DefaultErrorHandler;

	constructor(app: BaseApp<Pipeline>) {
		this.#default = new DefaultErrorHandler(app);
	}

	async renderError(request: Request, options: RenderErrorOptions): Promise<Response> {
		if (options.status === 500) {
			if (options.response) {
				return options.response;
			}
			throw options.error;
		}
		return this.#default.renderError(request, {
			...options,
			prerenderedErrorPageFetch: undefined,
		});
	}
}
