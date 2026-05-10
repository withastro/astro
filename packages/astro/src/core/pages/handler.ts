import { renderEndpoint } from '../../runtime/server/endpoint.js';
import { renderPage } from '../../runtime/server/index.js';
import type { APIContext } from '../../types/public/context.js';
import type { FetchState } from '../fetch/fetch-state.js';
import type { Pipeline } from '../base-pipeline.js';
import {
	ASTRO_ERROR_HEADER,
	REROUTE_DIRECTIVE_HEADER,
	REWRITE_DIRECTIVE_HEADER_KEY,
	REWRITE_DIRECTIVE_HEADER_VALUE,
	ROUTE_TYPE_HEADER,
} from '../constants.js';
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

		let response: Response;

		const componentInstance = await state.loadComponentInstance();
		switch (state.routeData!.type) {
			case 'endpoint': {
				response = await renderEndpoint(
					componentInstance as any,
					ctx,
					state.routeData!.prerender,
					logger,
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
				response.headers.set(ROUTE_TYPE_HEADER, 'page');
				// Signal to the error-page-rerouting infra to let this response pass through to avoid loops
				if (state.routeData!.route === '/404' || state.routeData!.route === '/500') {
					response.headers.set(REROUTE_DIRECTIVE_HEADER, 'no');
				}
				if (state.isRewriting) {
					response.headers.set(REWRITE_DIRECTIVE_HEADER_KEY, REWRITE_DIRECTIVE_HEADER_VALUE);
				}
				break;
			}
			case 'redirect': {
				return new Response(null, { status: 404, headers: { [ASTRO_ERROR_HEADER]: 'true' } });
			}
			case 'fallback': {
				return new Response(null, { status: 500, headers: { [ROUTE_TYPE_HEADER]: 'fallback' } });
			}
		}
		// We need to merge the cookies from the response back into the cookies
		// because they may need to be passed along from a rewrite.
		const responseCookies = getCookiesFromResponse(response);
		if (responseCookies) {
			state.cookies!.merge(responseCookies);
		}
		return response;
	}
}
