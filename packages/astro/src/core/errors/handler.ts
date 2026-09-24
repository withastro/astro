import type { RenderErrorOptions } from '../app/base.js';
import type { RouteData } from '../../types/public/index.js';
import type { SSRManifest } from '../app/types.js';
import type { FetchState } from '../fetch/fetch-state.js';
import { REROUTABLE_STATUS_CODES } from '../constants.js';
import { getEnvironment } from '../environment/index.js';
import { renderBuildError } from './build-handler.js';
import { renderDefaultError } from './default-handler.js';
import { renderDevError } from './dev-handler.js';

/**
 * A strategy for rendering error responses (404, 500, etc.).
 *
 * Internal shape of `BaseApp`'s `#errorHandler` (whose default wraps
 * {@link renderErrorPage}); external `BaseApp` subclasses may return their
 * own implementation from the protected `createErrorHandler()`.
 */
export interface ErrorHandler {
	renderError(request: Request, options: RenderErrorOptions): Promise<Response>;
}

/**
 * Renders the error page (404.astro / 500.astro or a plain response) for a
 * request, dispatching to the strategy the manifest's environment selects:
 * production/container default, dev (overlay + custom error routes, with or
 * without CSP meta-tag injection), or build (500s throw so the build fails).
 */
export function renderErrorPage(
	manifest: SSRManifest,
	request: Request,
	options: RenderErrorOptions,
): Promise<Response> {
	const env = getEnvironment(manifest);
	switch (env.errorStrategy) {
		case 'dev':
			return renderDevError(manifest, request, options, {
				shouldInjectCspMetaTags: env.injectCspMetaTagsOnErrorPages,
			});
		case 'build':
			return renderBuildError(manifest, request, options);
		case 'default':
			return renderDefaultError(manifest, request, options);
	}
}

/**
 * Dispatches an internal error render for a request flowing through the
 * handler chain: through the facade's late-bound `renderError` hook when the
 * state was built by `BaseApp.render`'s fast path (preserving instance
 * overrides/reassignments, e.g. cloudflare's prerender-error propagation),
 * else through the environment's strategy via {@link renderErrorPage}.
 */
export function renderErrorFromState(
	state: FetchState,
	request: Request,
	options: RenderErrorOptions,
): Promise<Response> {
	if (state.renderError) {
		return state.renderError(request, options);
	}
	return renderErrorPage(state.manifest, request, options);
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
