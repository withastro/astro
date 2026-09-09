import type { FetchState } from '../fetch/fetch-state.js';
import type { RewritePayload } from '../../types/public/common.js';
import type { APIContext } from '../../types/public/context.js';
import { ASTRO_ERROR_HEADER } from '../constants.js';
import { attachCookiesToResponse } from '../cookies/index.js';
import { getEnvironment } from '../environment/index.js';
import { renderErrorFromState } from '../errors/handler.js';
import { markFeatureUsed, FetchFeatures } from '../fetch/features.js';
import { applyRewriteToState } from '../rewrites/handler.js';
import { callMiddleware } from './callMiddleware.js';
import { getMiddleware } from './load.js';
import { sequence } from './index.js';

/**
 * Callback invoked at the bottom of the middleware chain to dispatch the
 * request to the matched route (endpoint / redirect / page / fallback).
 *
 * Callers of `handleMiddleware` pass `handlePages` (or a wrapper around it)
 * so route dispatch logic stays out of the middleware layer.
 */
export type RenderRouteCallback = (state: FetchState, ctx: APIContext) => Promise<Response>;

/**
 * Runs Astro's middleware chain (origin check + user `onRequest`) for a
 * single render, reading the composed middleware from the manifest and
 * per-request data (componentInstance, slots, props, API contexts) off the
 * supplied `FetchState`. The actual route dispatch (endpoint / redirect /
 * page / fallback) is supplied by the caller as `renderRouteCallback` —
 * typically `handlePages`.
 */
export async function handleMiddleware(
	state: FetchState,
	renderRouteCallback: RenderRouteCallback,
): Promise<Response> {
	markFeatureUsed(state.manifest, FetchFeatures.middleware);

	// Resolve props first (the async bit) so downstream consumers can
	// call `state.getAPIContext()` synchronously on the hot path.
	await state.getProps();
	const apiContext = state.getAPIContext();

	state.counter++;
	if (state.counter === 4) {
		return new Response('Loop Detected', {
			// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/508
			status: 508,
			statusText:
				'Astro detected a loop where you tried to call the rewriting logic more than four times.',
		});
	}

	const next = async (ctx: APIContext, payload?: RewritePayload) => {
		if (payload) {
			state.logger.debug('router', 'Called rewriting to:', payload);
			const result = await getEnvironment(state.manifest).tryRewrite(
				state.manifest,
				payload,
				state.request,
			);
			applyRewriteToState(state, payload, result);
		}
		return renderRouteCallback(state, ctx);
	};

	let response: Response;
	if (state.skipMiddleware) {
		response = await next(apiContext);
	} else {
		const middleware = await getMiddleware(state.manifest);
		// The `sequence` wrapper is kept (not unwrapped to a direct call) so
		// `callMiddleware` semantics stay bit-identical to the previous
		// `sequence(...internalMiddleware, middleware)` composition (the
		// internal middleware list was always empty).
		const composed = sequence(middleware);
		response = await callMiddleware(composed, apiContext, next);
	}
	// LEGACY: we put cookies on the response object,
	// where the adapter might be expecting to read it.
	// New code should be using `app.render({ addCookieHeader: true })` instead.
	attachCookiesToResponse(response, state.cookies!);
	state.response = response;
	return response;
}

/**
 * Like `handleMiddleware`, but mirrors the app-level error handling that
 * `handleRequest` provides on the standard path, the same way
 * `handlePagesWithErrorFallback` does for `pages()`. When no route matched
 * it returns a 404 marked with `X-Astro-Error` for the app's post-check;
 * when Astro's own middleware chain throws it logs the error and renders
 * the custom `500.astro`.
 *
 * Errors surfaced through `renderRouteCallback` (the host framework's
 * `next`, e.g. host middleware mounted below `middleware()`) are re-thrown
 * instead, so the host's own error handling still runs rather than being
 * swallowed into Astro's 500 page. A sentinel tells the two apart.
 *
 * Used by the composable `astro/fetch` `middleware()` entry point, where
 * there is no surrounding `handleRequest` to supply this fallback.
 */
export async function handleMiddlewareWithErrorFallback(
	state: FetchState,
	renderRouteCallback: RenderRouteCallback,
): Promise<Response> {
	// `FetchState` falls back to an SSR 404 route when nothing matches, so
	// routeData is only missing when the custom 404 page is prerendered (or
	// absent). Returning a marked 404 lets the app's `X-Astro-Error`
	// post-check render the 404 page a level up, mirroring
	// `handlePagesWithErrorFallback`; running user middleware here
	// would throw on the missing route (no component to load).
	if (!state.routeData) {
		return new Response(null, { status: 404, headers: { [ASTRO_ERROR_HEADER]: 'true' } });
	}
	let nextError: unknown;
	try {
		return await handleMiddleware(state, async (s, ctx) => {
			try {
				return await renderRouteCallback(s, ctx);
			} catch (err) {
				nextError = err;
				throw err;
			}
		});
	} catch (err: any) {
		if (err === nextError) throw err;
		// User middleware threw: log the stack and render the custom 500
		// page, the same way `handleRequest` does on the standard path.
		state.logger.error(null, err.stack || err.message || String(err));
		return renderErrorFromState(state, state.request, {
			...state.renderOptions,
			status: 500,
			error: err,
			pathname: state.pathname,
		});
	}
}
