import type { RegisteredFetchHandler } from '../../../index.js';
import type { APIContext } from '../../../index.js';
import { REROUTABLE_STATUS_CODES } from '../constants.js';
import { handleTrailingSlash } from './trailing-slash-handler.js';
import { rejectInvalidEncoding } from './invalid-encoding.js';
import { getEnvironment, type RequestLogPayload } from '../environment/index.js';
import { renderErrorFromState } from '../errors/handler.js';
import { handleNotFound } from '../errors/not-found.js';
import { markAllHandlersUsed } from '../fetch/features.js';
import {
	applyRenderContextExtensions,
	getLoadedPipeline,
	loadPipeline,
} from '../fetch/pipeline.js';
import { getResolvedLogger } from '../logger/manifest-logger.js';
import { handleMiddleware } from '../middleware/astro-middleware.js';
import { handlePages } from '../pages/handler.js';
import { renderRedirect } from '../redirects/render.js';
import { redirectDelayFor, renderRedirectPage } from './redirect-page.js';
import type { FetchState } from '../fetch/fetch-state.js';
import { prepareResponse } from '../../../core/app/prepare-response.js';
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
 * Runs the `'post'` fetch handlers from `index` onwards, then dispatches to the matched route
 * with the context the middleware chain passed down.
 */
function runPostHandlers(
	state: FetchState,
	ctx: APIContext,
	handlers: readonly RegisteredFetchHandler[],
	index: number,
): Promise<Response> {
	if (index === handlers.length) return handlePages(state, ctx);
	return handlers[index].handler(state, (s) => runPostHandlers(s, ctx, handlers, index + 1));
}

/**
 * Runs the `'pre'` fetch handlers from `index` onwards, then the middleware chain, whose bottom
 * runs the `'post'` handlers and route dispatch.
 */
function runPreHandlers(
	state: FetchState,
	pre: readonly RegisteredFetchHandler[],
	post: readonly RegisteredFetchHandler[],
	index: number,
): Promise<Response> {
	if (index === pre.length) {
		return handleMiddleware(state, (s, ctx) => runPostHandlers(s, ctx, post, 0));
	}
	return pre[index].handler(state, (s) => runPreHandlers(s, pre, post, index + 1));
}

const pipelineHandlers = new WeakMap<
	readonly RegisteredFetchHandler[],
	{ pre: RegisteredFetchHandler[]; post: RegisteredFetchHandler[] }
>();

function splitHandlers(handlers: readonly RegisteredFetchHandler[]) {
	let split = pipelineHandlers.get(handlers);
	if (!split) {
		split = {
			pre: handlers.filter((h) => h.order === 'pre'),
			post: handlers.filter((h) => h.order === 'post'),
		};
		pipelineHandlers.set(handlers, split);
	}
	return split;
}

/**
 * Swaps a bodiless redirect response for one carrying the project's rendered
 * `src/pages/3xx.astro`.
 *
 * Only the build environment opts in (see `RenderEnvironment.rendersRedirectPage`):
 * a static site has no `Location` header to follow, so the HTML body is the
 * redirect. Responses that already carry a body — the trailing-slash
 * normalizer's, or a page that rendered its own — are left alone.
 */
async function withRedirectPageBody(state: FetchState, response: Response): Promise<Response> {
	const status = response.status;
	if (status < 300 || status >= 400 || response.body !== null) {
		return response;
	}
	if (!getEnvironment(state.manifest).rendersRedirectPage()) {
		return response;
	}
	const to = response.headers.get('location');
	if (!to) {
		return response;
	}
	const html = await renderRedirectPage(state.manifest, state.request, {
		from: state.pathname,
		to,
		status,
		delay: redirectDelayFor(status),
	});
	if (html === undefined) {
		return response;
	}
	const headers = new Headers(response.headers);
	if (!headers.has('content-type')) {
		headers.set('content-type', 'text/html');
	}
	return new Response(html, { status, statusText: response.statusText, headers });
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

	// handleRequest is the "batteries-included" handler that runs every
	// pipeline step. Mark them all as used so the missing-feature warning in
	// BaseApp never fires — the user didn't forget to include anything.
	markAllHandlersUsed(state.manifest);

	const invalidEncodingResponse = rejectInvalidEncoding(state);
	if (invalidEncodingResponse) {
		return invalidEncodingResponse;
	}

	const trailingSlashRedirect = handleTrailingSlash(state);
	if (trailingSlashRedirect) {
		return trailingSlashRedirect;
	}

	const notFoundResponse = handleNotFound(state);
	if (notFoundResponse) {
		return notFoundResponse;
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
		const pipeline = getLoadedPipeline(state.manifest) ?? (await loadPipeline(state.manifest));
		const extensionsApplied = applyRenderContextExtensions(state, pipeline);
		if (extensionsApplied) await extensionsApplied;

		// Redirect routes short-circuit the pipeline: no middleware, no
		// page dispatch, no i18n post-processing. Inline routeData.type
		// check to avoid a per-request function call + object overhead.
		if (routeData.type === 'redirect') {
			const redirectResponse = await withRedirectPageBody(state, await renderRedirect(state));
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

		const { pre, post } = splitHandlers(pipeline.fetchHandlers);
		response = await runPreHandlers(state, pre, post, 0);

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

	response = await withRedirectPageBody(state, response);
	prepareResponse(response, { addCookieHeader });
	state.logger.flush();
	return response;
}
