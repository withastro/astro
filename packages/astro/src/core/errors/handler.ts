import type { RenderErrorOptions } from '../app/base.js';
import type { RouteData } from '../../types/public/index.js';
import { REROUTABLE_STATUS_CODES } from '../constants.js';

/**
 * A strategy for rendering error responses (404, 500, etc.). Each execution
 * environment (prod SSR, build/prerender, dev server) supplies its own
 * implementation rather than overriding a method on the app.
 */
export interface ErrorHandler {
	renderError(request: Request, options: RenderErrorOptions): Promise<Response>;
}

/**
 * Whether a middleware rewrite (`ctx.rewrite()` / `next(payload)`) issued while
 * rendering the error page dead-ended in another empty reroutable (404/500)
 * response. The rewrite swaps the state's routeData away from the error route,
 * so returning that render as-is would produce a blank page; the error handler
 * should instead retry rendering the error page without middleware.
 *
 * @param skipMiddleware Whether middleware was already skipped for this render.
 * @param errorRouteData The error route matched before middleware ran.
 * @param renderedRouteData The route data on the state after middleware ran.
 * @param response The response produced by the middleware-driven render.
 */
export function rewroteToEmptyErrorResponse(
	skipMiddleware: boolean,
	errorRouteData: RouteData,
	renderedRouteData: RouteData | undefined,
	response: Response,
): boolean {
	return (
		skipMiddleware === false &&
		renderedRouteData !== errorRouteData &&
		response.body === null &&
		REROUTABLE_STATUS_CODES.includes(response.status)
	);
}
