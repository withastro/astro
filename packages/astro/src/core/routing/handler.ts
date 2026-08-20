import { handleAction } from '../../actions/handler.js';
import type { APIContext } from '../../types/public/context.js';
import { REROUTABLE_STATUS_CODES } from '../constants.js';
import { handleTrailingSlash } from './trailing-slash-handler.js';
import { handleCache, provideCache } from '../cache/handler.js';
import { getEnvironment, type RequestLogPayload } from '../environment/index.js';
import { renderErrorFromState } from '../errors/handler.js';
import { ALL_FETCH_FEATURES, markFeatureUsed, FetchFeatures } from '../fetch/features.js';
import { finalizeI18n, getI18n } from '../i18n/handler.js';
import { getResolvedLogger } from '../logger/manifest-logger.js';
import { handleMiddleware } from '../middleware/astro-middleware.js';
import { handlePages } from '../pages/handler.js';
import { renderRedirect } from '../redirects/render.js';
import { provideSession } from '../session/provider.js';
import type { FetchState } from '../fetch/fetch-state.js';
import { prepareResponse } from '../app/prepare-response.js';
import { getDefaultStatusCode } from './helpers.js';

/**
 * Dispatches request logging: through the facade's late-bound
 * `logThisRequest` hook when the state was built by `BaseApp.render`'s fast
 * path (preserving subclass overrides), else through the environment's
 * `logRequest` behavior (dev request lines; prod/build/container no-op).
 */
function logRequestFromState(state: FetchState, payload: RequestLogPayload): void {
	if (state.logRequest) {
		state.logRequest(payload);
	} else {
		getEnvironment(state.manifest).logRequest(state.manifest, payload);
	}
}

/**
 * Runs actions then pages — the callback at the bottom of the middleware
 * chain. A module-level function so passing it by reference costs zero
 * per-request allocation.
 */
function actionsAndPages(state: FetchState, ctx: APIContext): Promise<Response> {
	if (!state.skipMiddleware) {
		const actionResult = handleAction(ctx, state);
		if (actionResult) {
			return actionResult.then((response) => response ?? handlePages(state, ctx));
		}
	}
	return handlePages(state, ctx);
}

/**
 * The composite "batteries-included" handler that wires up every request
 * feature internally; `astro(state)` (astro/fetch) delegates here, as does
 * `BaseApp.render`'s default-handler fast path.
 */
export async function handleRequest(state: FetchState): Promise<Response> {
	// Resolve the user-configured logger destination before anything logs.
	// Memoized single-flight — on facade-driven requests this is already a
	// resolved promise (BaseApp.render awaits it first).
	await getResolvedLogger(state.manifest);

	// handleRequest is the "batteries-included" handler that wires up
	// every pipeline feature internally. Mark them all as used so the
	// missing-feature warning in BaseApp never fires — the user didn't
	// forget to include anything.
	markFeatureUsed(state.manifest, ALL_FETCH_FEATURES);

	// Reject paths that were encoded too many times to fully decode, before
	// any routing or middleware runs. If we let them through, middleware
	// could check one path while a later decode turns it into a different
	// route.
	if (state.invalidEncoding) {
		return new Response(null, { status: 400, statusText: 'Bad Request' });
	}

	const trailingSlashRedirect = handleTrailingSlash(state);
	if (trailingSlashRedirect) {
		return trailingSlashRedirect;
	}

	if (!state.routeData) {
		return renderErrorFromState(state, state.request, {
			...state.renderOptions,
			status: 404,
			pathname: state.pathname,
		});
	}

	return render(state);
}

/**
 * Renders a response for the given `FetchState`. Assumes trailing-slash
 * redirects and routeData resolution have already run.
 *
 * User-triggered rewrites (`Astro.rewrite` / `ctx.rewrite`) go through
 * `executeRewrite` on the current `FetchState` — they mutate the existing
 * state in place and re-run middleware + page dispatch.
 */
async function render(state: FetchState): Promise<Response> {
	const routeData = state.routeData!;
	const pathname = state.pathname;
	const request = state.request;
	const { addCookieHeader } = state.renderOptions;
	state.status = getDefaultStatusCode(state.manifest, routeData, pathname);

	let response;
	let finalizeError: unknown;
	try {
		// `provideCache` always runs so `Astro.cache` is defined even
		// when caching is disabled — it registers a no-op shim that
		// warns once on use. `provideSession` is gated because there
		// is no equivalent disabled-shim contract for sessions.
		const sessionP = state.manifest.sessionConfig ? provideSession(state) : undefined;
		const cacheP = provideCache(state);
		if (sessionP || cacheP) await Promise.all([sessionP, cacheP]);
		// Track feature usage even when skipped.
		markFeatureUsed(state.manifest, FetchFeatures.sessions);

		// Redirect routes short-circuit the pipeline: no middleware, no
		// page dispatch, no i18n post-processing. Inline routeData.type
		// check to avoid a per-request function call + object overhead.
		if (routeData.type === 'redirect') {
			const redirectResponse = await renderRedirect(state);
			logRequestFromState(state, {
				pathname,
				method: request.method,
				statusCode: redirectResponse.status,
				isRewrite: false,
				timeStart: state.timeStart,
			});
			prepareResponse(redirectResponse, { addCookieHeader });
			state.logger.flush();
			return redirectResponse;
		}

		// `null` when i18n is unset or the strategy is `manual` — for the
		// manual strategy users wire `astro:i18n.middleware(...)` into their
		// own `onRequest`.
		const i18n = getI18n(state.manifest);

		// When no cache provider is configured (the common case), run
		// the middleware + i18n pipeline directly without going through
		// the cache handler. This avoids a closure allocation and an
		// extra function call per request.
		if (!state.manifest.cacheProvider) {
			markFeatureUsed(state.manifest, FetchFeatures.cache);
			response = await handleMiddleware(state, actionsAndPages);
			if (i18n) {
				response = await finalizeI18n(i18n, state, response);
			}
		} else {
			const runPipeline = async (): Promise<Response> => {
				let res = await handleMiddleware(state, actionsAndPages);
				if (i18n) {
					res = await finalizeI18n(i18n, state, res);
				}
				return res;
			};
			response = await handleCache(state, runPipeline);
		}

		logRequestFromState(state, {
			pathname,
			method: request.method,
			statusCode: response.status,
			isRewrite: state.isRewriting,
			timeStart: state.timeStart,
		});
	} catch (err: any) {
		state.logger.error(null, err.stack || err.message || String(err));
		return renderErrorFromState(state, request, {
			...state.renderOptions,
			status: 500,
			error: err,
			pathname: state.pathname,
		});
	} finally {
		// finalizeAll runs after the response is produced, so a rejection
		// here would otherwise escape the handler. Capture it and turn it
		// into a 500 below so the request always completes.
		try {
			const finalize = state.finalizeAll();
			if (finalize) await finalize;
		} catch (err: any) {
			finalizeError = err;
			state.logger.error(null, err.stack || err.message || String(err));
		}
	}

	if (finalizeError) {
		return renderErrorFromState(state, request, {
			...state.renderOptions,
			status: 500,
			error: finalizeError,
			pathname: state.pathname,
		});
	}

	if (
		REROUTABLE_STATUS_CODES.includes(response.status) &&
		// If the body isn't null, that means the user sets the 404 status
		// but uses the current route to handle the 404
		response.body === null &&
		!state.skipErrorReroute
	) {
		return renderErrorFromState(state, request, {
			...state.renderOptions,
			response,
			status: response.status as 404 | 500,
			// We don't have an error to report here. Passing null means we pass nothing intentionally
			// while undefined means there's no error
			error: response.status === 500 ? null : undefined,
			pathname: state.pathname,
		});
	}

	prepareResponse(response, { addCookieHeader });
	state.logger.flush();
	return response;
}
