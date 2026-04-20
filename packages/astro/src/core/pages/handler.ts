import { ActionHandler } from '../../actions/handler.js';
import { renderEndpoint } from '../../runtime/server/endpoint.js';
import { renderPage } from '../../runtime/server/index.js';
import type { RewritePayload } from '../../types/public/common.js';
import type { APIContext } from '../../types/public/context.js';
import type { FetchState } from '../app/fetch-state.js';
import type { Pipeline } from '../base-pipeline.js';
import {
	REROUTE_DIRECTIVE_HEADER,
	REWRITE_DIRECTIVE_HEADER_KEY,
	REWRITE_DIRECTIVE_HEADER_VALUE,
	ROUTE_TYPE_HEADER,
} from '../constants.js';
import { getCookiesFromResponse } from '../cookies/response.js';
import { ForbiddenRewrite } from '../errors/errors-data.js';
import { AstroError } from '../errors/errors.js';
import { renderRedirect } from '../redirects/render.js';
import { getParams } from '../render/index.js';
import { RenderContext } from '../render-context.js';
import { copyRequest, setOriginPathname } from '../routing/rewrite.js';

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
	#actionHandler: ActionHandler;

	constructor(pipeline: Pipeline) {
		this.#pipeline = pipeline;
		this.#actionHandler = new ActionHandler();
	}

	async handle(state: FetchState, ctx: APIContext, payload?: RewritePayload): Promise<Response> {
		const pipeline = this.#pipeline;
		const { logger, streaming } = pipeline;
		const renderContext = state.getRenderContext();

		if (payload) {
			const oldPathname = renderContext.pathname;
			pipeline.logger.debug('router', 'Called rewriting to:', payload);
			// we intentionally let the error bubble up
			const {
				routeData,
				componentInstance: newComponent,
				pathname,
				newUrl,
			} = await pipeline.tryRewrite(payload, renderContext.request);

			// This is a case where the user tries to rewrite from a SSR route to a prerendered route (SSG).
			// This case isn't valid because when building for SSR, the prerendered route disappears from the server output because it becomes an HTML file,
			// so Astro can't retrieve it from the emitted manifest.
			if (
				pipeline.manifest.serverLike === true &&
				renderContext.routeData.prerender === false &&
				routeData.prerender === true
			) {
				throw new AstroError({
					...ForbiddenRewrite,
					message: ForbiddenRewrite.message(renderContext.pathname, pathname, routeData.component),
					hint: ForbiddenRewrite.hint(routeData.component),
				});
			}

			renderContext.routeData = routeData;
			state.componentInstance = newComponent;
			if (payload instanceof Request) {
				renderContext.request = payload;
			} else {
				renderContext.request = copyRequest(
					newUrl,
					renderContext.request,
					// need to send the flag of the previous routeData
					routeData.prerender,
					pipeline.logger,
					renderContext.routeData.route,
				);
			}
			renderContext.isRewriting = true;
			renderContext.url = RenderContext.createNormalizedUrl(renderContext.request.url);
			renderContext.params = getParams(routeData, pathname);
			renderContext.pathname = pathname;
			renderContext.status = 200;
			setOriginPathname(
				renderContext.request,
				oldPathname,
				pipeline.manifest.trailingSlash,
				pipeline.manifest.buildFormat,
			);
			// Route changed underneath us — drop memoized props/contexts so
			// the dispatcher below sees values derived from the new route.
			state.invalidateContexts();
		}
		let response: Response;

		// Handle Astro Action requests (RPC + form).
		// - RPC: returns a serialized action result and short-circuits rendering.
		// - Form: runs the action, stashes the result in `locals._actionPayload`,
		//   and falls through to render the page normally.
		// Skipped during error-page recovery (skipMiddleware=true) to match
		// the prior form-action behavior and avoid re-running the action.
		if (!renderContext.skipMiddleware) {
			const actionResponse = await this.#actionHandler.handle(ctx);
			if (actionResponse) {
				return actionResponse;
			}
		}

		const componentInstance = state.componentInstance;
		switch (renderContext.routeData.type) {
			case 'endpoint': {
				response = await renderEndpoint(
					componentInstance as any,
					ctx,
					renderContext.routeData.prerender,
					logger,
				);
				break;
			}
			case 'redirect':
				return renderRedirect(renderContext);
			case 'page': {
				const props = await state.getProps();
				const actionApiContext = state.getActionAPIContext();
				renderContext.result = await renderContext.createResult(
					componentInstance!,
					actionApiContext,
				);
				try {
					response = await renderPage(
						renderContext.result,
						componentInstance?.default as any,
						props,
						state.slots,
						streaming,
						renderContext.routeData,
					);
				} catch (e) {
					// If there is an error in the page's frontmatter or instantiation of the RenderTemplate fails midway,
					// we signal to the rest of the internals that we can ignore the results of existing renders and avoid kicking off more of them.
					renderContext.result.cancelled = true;
					throw e;
				}

				// Signal to the i18n middleware to maybe act on this response
				response.headers.set(ROUTE_TYPE_HEADER, 'page');
				// Signal to the error-page-rerouting infra to let this response pass through to avoid loops
				if (
					renderContext.routeData.route === '/404' ||
					renderContext.routeData.route === '/500'
				) {
					response.headers.set(REROUTE_DIRECTIVE_HEADER, 'no');
				}
				if (renderContext.isRewriting) {
					response.headers.set(REWRITE_DIRECTIVE_HEADER_KEY, REWRITE_DIRECTIVE_HEADER_VALUE);
				}
				break;
			}
			case 'fallback': {
				return new Response(null, { status: 500, headers: { [ROUTE_TYPE_HEADER]: 'fallback' } });
			}
		}
		// We need to merge the cookies from the response back into renderContext.cookies
		// because they may need to be passed along from a rewrite.
		const responseCookies = getCookiesFromResponse(response);
		if (responseCookies) {
			renderContext.getCookies().merge(responseCookies);
		}
		return response;
	}
}
