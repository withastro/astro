import type { SSRManifest } from '../../types/public/index.js';
import type { Pipeline } from '../base-pipeline.js';
import type { AstroLogger } from '../logger/core.js';
import type { FetchState } from '../app/fetch-state.js';
import type { PrepareOptions } from '../app/prepare.js';
import { NOOP_MIDDLEWARE_HEADER, REROUTE_DIRECTIVE_HEADER, REWRITE_DIRECTIVE_HEADER_KEY, ROUTE_TYPE_HEADER } from '../constants.js';
import { createMatchRouteData } from './match-route-data.js';
import { handleTrailingSlash } from './trailing-slash.js';
import { createRedirectsHandler } from '../redirects/handler.js';
import { createRewritesHandler } from '../rewrites/handler.js';
import { createI18nHandler } from '../../i18n/handler.js';
import { createUserMiddlewareHandler } from '../middleware/handler.js';
import { createPagesHandler } from '../pages/handler.js';
import { createActionsHandler } from '../../actions/handler.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AstroHandlerDeps {
	pipeline: Pipeline;
	manifest: SSRManifest;
	logger: AstroLogger;
}

export interface AstroHandlerOptions extends PrepareOptions {
	isDev?: boolean;
	allowPrerenderedRoutes?: boolean;
	addCookieHeader?: boolean;
}

// ---------------------------------------------------------------------------
// Internal header stripping
// ---------------------------------------------------------------------------

const INTERNAL_HEADERS = [REROUTE_DIRECTIVE_HEADER, ROUTE_TYPE_HEADER, NOOP_MIDDLEWARE_HEADER, REWRITE_DIRECTIVE_HEADER_KEY];

function stripInternalHeaders(response: Response): Response {
	try {
		for (const header of INTERNAL_HEADERS) {
			response.headers.delete(header);
		}
		return response;
	} catch {
		// Headers are immutable — create a new Response with cleaned headers
		const headers = new Headers(response.headers);
		for (const header of INTERNAL_HEADERS) {
			headers.delete(header);
		}
		return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
	}
}

// ---------------------------------------------------------------------------
// Composed request handler
// ---------------------------------------------------------------------------

/**
 * Creates the fully composed Astro request handler that processes a request
 * through the complete lifecycle:
 *
 * trailing slash → route resolution → redirects → user middleware(actions → pages) → rewrite → i18n
 *
 * This is framework-agnostic — it takes a FetchState and returns a Response.
 * No Hono dependency.
 */
export function createAstroHandler(
	deps: AstroHandlerDeps,
	options: AstroHandlerOptions = {},
): (state: FetchState) => Promise<Response> {
	const { pipeline, manifest } = deps;
	const isDev = options.isDev ?? (pipeline.runtimeMode === 'development');
	const shouldAllowPrerendered = options.allowPrerenderedRoutes ?? isDev;
	const rawMatchRouteData = createMatchRouteData(deps);
	const matchRouteData = (req: Request) => rawMatchRouteData(req, { allowPrerenderedRoutes: shouldAllowPrerendered });

	const handleRedirects = createRedirectsHandler(manifest);
	const handleUserMiddleware = createUserMiddlewareHandler(deps, options);
	const handleActions = createActionsHandler(deps);
	const handleRewrites = createRewritesHandler(deps, matchRouteData);
	const handleI18n = createI18nHandler(manifest, matchRouteData);
	const handlePages = createPagesHandler(deps, matchRouteData, options);

	return async (state: FetchState): Promise<Response> => {
		const request = state.request;

		// 1. Trailing slash redirects
		const trailingSlashResponse = handleTrailingSlash(request, manifest);
		if (trailingSlashResponse) return trailingSlashResponse;

		// 2. Route resolution — set early so user middleware can access routePattern/isPrerendered
		if (!state.routeData) {
			const routeData = matchRouteData(request);
			if (routeData) state.routeData = routeData;
		}

		// 3. Redirects
		const redirectResponse = handleRedirects(request);
		if (redirectResponse) return redirectResponse;

		// 4. User middleware wraps actions + pages
		let response = await handleUserMiddleware(state, async () => {
			// 5. Actions
			const actionResponse = await handleActions(state);
			if (actionResponse) return actionResponse;

			// 6. Pages (terminal)
			return handlePages(state);
		});

		// 7. Rewrite (post-processor)
		const rewriteResponse = await handleRewrites(state);
		if (rewriteResponse) response = rewriteResponse;

		// 8. i18n (post-processor)
		if (handleI18n) {
			const i18nResponse = handleI18n(state, response);
			if (i18nResponse) response = i18nResponse;
		}

		// 9. Strip internal headers
		return stripInternalHeaders(response);
	};
}
