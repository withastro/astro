import { renderEndpoint } from '../../runtime/server/endpoint.js';
import { renderPage } from '../../runtime/server/index.js';
import type { APIContext } from '../../types/public/context.js';
import type { BaseApp } from '../app/base.js';
import type { FetchState } from '../fetch/fetch-state.js';
import type { Pipeline } from '../base-pipeline.js';
import { ASTRO_ERROR_HEADER } from '../constants.js';
import {
	createCrossOriginForbiddenResponse,
	isForbiddenCrossOriginRequest,
} from '../app/origin-check.js';
import { getCookiesFromResponse } from '../cookies/response.js';

// Shared empty-slots object so we don't allocate `{}` on every render for
// requests that don't come from the container API. Safe to share because
// the slots object is read-only from the runtime's perspective.
const EMPTY_SLOTS: Record<string, never> = Object.freeze({});

/**
 * Handles dispatch of a matched route (endpoint / redirect / page / fallback)
 * at the bottom of the middleware chain. This is a pure dispatch layer — it
 * renders whatever route the `FetchState` currently points to without any
 * rewrite logic. Rewrites are handled upstream: `Rewrites.execute()` for
 * `Astro.rewrite()` and `AstroMiddleware` for `next(payload)`.
 *
 * `PagesHandler` is the `next` callback that `AstroMiddleware` invokes at
 * the end of the middleware chain. `AstroHandler` owns a single instance
 * and passes its `handle` method as the callback. Error handlers and the
 * container also use `PagesHandler` directly for the same dispatch behavior.
 */
export class PagesHandler {
	#pipeline: Pipeline;

	constructor(pipeline: Pipeline) {
		this.#pipeline = pipeline;
	}

	async handle(state: FetchState, ctx: APIContext): Promise<Response> {
		const pipeline = this.#pipeline;
		const { logger, streaming } = pipeline;
		state.resetResponseMetadata();

		let response: Response;

		const componentInstance = await state.loadComponentInstance();
		switch (state.routeData!.type) {
			case 'endpoint': {
				response = await renderEndpoint(
					componentInstance as any,
					ctx,
					state.routeData!.prerender,
					logger,
					state,
				);
				break;
			}
			case 'page': {
				const props = await state.getProps();
				const actionApiContext = state.getActionAPIContext();
				const result = await state.createResult(componentInstance!, actionApiContext);
				try {
					response = await renderPage(
						result,
						componentInstance?.default as any,
						props,
						state.slots ?? EMPTY_SLOTS,
						streaming,
						state.routeData!,
					);
				} catch (e) {
					// If there is an error in the page's frontmatter or instantiation of the RenderTemplate fails midway,
					// we signal to the rest of the internals that we can ignore the results of existing renders and avoid kicking off more of them.
					result.cancelled = true;
					throw e;
				}

				// Signal to the i18n middleware to maybe act on this response
				state.responseRouteType = 'page';
				// Signal to the error-page-rerouting infra to let this response pass through to avoid loops
				if (state.routeData!.route === '/404' || state.routeData!.route === '/500') {
					state.skipErrorReroute = true;
				}
				break;
			}
			case 'redirect': {
				return new Response(null, { status: 404, headers: { [ASTRO_ERROR_HEADER]: 'true' } });
			}
			case 'fallback': {
				state.responseRouteType = 'fallback';
				return new Response(null, { status: 500 });
			}
		}
		// We need to merge the cookies from the response back into the cookies
		// because they may need to be passed along from a rewrite.
		const responseCookies = getCookiesFromResponse(response);
		if (responseCookies) {
			state.cookies!.merge(responseCookies);
		}
		state.response = response;
		return response;
	}

	/**
	 * Like `handle`, but mirrors the app-level error handling that
	 * `AstroHandler` provides on the standard path: unmatched routes
	 * return a 404 marked with `X-Astro-Error` for the app's post-check
	 * to render the 404 error page, and render-time errors are logged
	 * and render the 500 error page instead of propagating to the host
	 * framework.
	 *
	 * Used by the composable `astro/fetch` `pages()` entry point, where
	 * there is no surrounding `AstroHandler` to supply this fallback.
	 */
	async handleWithErrorFallback(app: BaseApp<Pipeline>, state: FetchState): Promise<Response> {
		// `FetchState` falls back to an SSR 404 route when nothing matches,
		// so routeData is only missing when the custom 404 page is
		// prerendered (or absent). Return a marked 404 and let the app's
		// `X-Astro-Error` post-check render the error page a level up,
		// the same way the un-dispatched `redirect` case above does.
		if (!state.routeData) {
			return new Response(null, { status: 404, headers: { [ASTRO_ERROR_HEADER]: 'true' } });
		}
		const ctx = state.getAPIContext();
		// The origin check normally runs in the origin-check middleware, but a
		// composable pipeline can dispatch here without running `middleware()`
		// first (or at all). Apply the same check so it holds regardless of how
		// the pipeline is composed.
		if (
			this.#pipeline.manifest.checkOrigin &&
			isForbiddenCrossOriginRequest(ctx.request, ctx.url, ctx.isPrerendered)
		) {
			return createCrossOriginForbiddenResponse(ctx.request);
		}
		try {
			return await this.handle(state, ctx);
		} catch (err: any) {
			// The header marker can't carry the error object, so render the
			// 500 page directly to preserve `error` and the logged stack.
			app.logger.error(null, err.stack || err.message || String(err));
			return app.renderError(state.request, {
				...state.renderOptions,
				status: 500,
				error: err,
				pathname: state.pathname,
			});
		}
	}
}
