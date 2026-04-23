import { renderEndpoint } from '../../runtime/server/endpoint.js';
import { renderPage } from '../../runtime/server/index.js';
import type { RewritePayload } from '../../types/public/common.js';
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
import { ForbiddenRewrite } from '../errors/errors-data.js';
import { AstroError } from '../errors/errors.js';
import { getParams } from '../render/index.js';
import { copyRequest, setOriginPathname } from '../routing/rewrite.js';
import { createNormalizedUrl } from '../util/normalized-url.js';

// Shared empty-slots object so we don't allocate `{}` on every render for
// requests that don't come from the container API. Safe to share because
// the slots object is read-only from the runtime's perspective.
const EMPTY_SLOTS: Record<string, never> = Object.freeze({});

/**
 * Handles dispatch of a matched route (endpoint / redirect / page / fallback)
 * at the bottom of the middleware chain. Also handles in-flight route
 * rewrites (when a middleware or action calls `Astro.rewrite(...)`) by
 * mutating the `RenderContext` to reflect the rewritten target before
 * dispatching.
 *
 * `PagesHandler` is the `next` callback that `AstroMiddleware` invokes at
 * the end of the middleware chain. `AstroHandler` owns a single instance
 * and passes its `handle` method as the callback. `RenderContext` also
 * owns one so error handlers and the container — which call
 * `RenderContext.render()` without a callback — get the same dispatch
 * behavior.
 */
export class PagesHandler {
	#pipeline: Pipeline;

	constructor(pipeline: Pipeline) {
		this.#pipeline = pipeline;
	}

	async handle(state: FetchState, ctx: APIContext, payload?: RewritePayload): Promise<Response> {
		const pipeline = this.#pipeline;
		const { logger, streaming } = pipeline;

		if (payload) {
			const oldPathname = state.pathname;
			pipeline.logger.debug('router', 'Called rewriting to:', payload);
			// we intentionally let the error bubble up
			const {
				routeData,
				componentInstance: newComponent,
				pathname,
				newUrl,
			} = await pipeline.tryRewrite(payload, state.request);

			// This is a case where the user tries to rewrite from a SSR route to a prerendered route (SSG).
			// This case isn't valid because when building for SSR, the prerendered route disappears from the server output because it becomes an HTML file,
			// so Astro can't retrieve it from the emitted manifest.
			if (
				pipeline.manifest.serverLike === true &&
				state.routeData!.prerender === false &&
				routeData.prerender === true
			) {
				throw new AstroError({
					...ForbiddenRewrite,
					message: ForbiddenRewrite.message(state.pathname, pathname, routeData.component),
					hint: ForbiddenRewrite.hint(routeData.component),
				});
			}

			state.routeData = routeData;
			state.componentInstance = newComponent;
			if (payload instanceof Request) {
				state.request = payload;
			} else {
				state.request = copyRequest(
					newUrl,
					state.request,
					// need to send the flag of the previous routeData
					routeData.prerender,
					pipeline.logger,
					state.routeData!.route,
				);
			}
			state.isRewriting = true;
			state.url = createNormalizedUrl(state.request.url);
			state.params = getParams(routeData, pathname);
			state.pathname = pathname;
			state.status = 200;
			setOriginPathname(
				state.request,
				oldPathname,
				pipeline.manifest.trailingSlash,
				pipeline.manifest.buildFormat,
			);
			// Route changed underneath us — drop memoized props/contexts so
			// the dispatcher below sees values derived from the new route.
			state.invalidateContexts();
		}
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
				const result = await state.createResult(
					componentInstance!,
					actionApiContext,
				);
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
				if (
					state.routeData!.route === '/404' ||
					state.routeData!.route === '/500'
				) {
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
