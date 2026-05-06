import type { RenderErrorOptions } from '../app/base.js';

/**
 * A strategy for rendering error responses (404, 500, etc.). Each execution
 * environment (prod SSR, build/prerender, dev server) supplies its own
 * implementation rather than overriding a method on the app.
 */
export interface ErrorHandler {
	renderError(request: Request, options: RenderErrorOptions): Promise<Response>;
}
