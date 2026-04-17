import type { ActionAPIContext } from '../../actions/runtime/types.js';
import type { ComponentInstance } from '../../types/astro.js';
import type { RewritePayload } from '../../types/public/common.js';
import type { APIContext } from '../../types/public/context.js';
import type { Pipeline } from '../base-pipeline.js';
import { ROUTE_TYPE_HEADER } from '../constants.js';
import { attachCookiesToResponse } from '../cookies/index.js';
import type { RenderContext } from '../render-context.js';
import { getProps } from '../render/index.js';
import { callMiddleware } from './callMiddleware.js';
import { sequence } from './index.js';

/**
 * A mutable reference to the current component instance. Rewrites inside
 * the middleware chain may swap the component, so we thread a reference
 * through rather than a plain value.
 */
export interface ComponentRef {
	current: ComponentInstance | undefined;
}

/**
 * Callback invoked at the bottom of the middleware chain to dispatch the
 * request to the matched route (endpoint / redirect / page / fallback).
 *
 * Callers of `AstroMiddleware.handle` pass their owned `PagesHandler`'s
 * `handle` method (bound) so route dispatch logic stays out of the
 * middleware layer.
 */
export type RenderRouteCallback = (
	renderContext: RenderContext,
	componentRef: ComponentRef,
	slots: Record<string, any>,
	props: APIContext['props'],
	actionApiContext: ActionAPIContext,
	ctx: APIContext,
	payload?: RewritePayload,
) => Promise<Response>;

/**
 * Handles the execution of Astro's middleware chain (internal + user) for a
 * single render. Holds a reference to the `Pipeline` and composes the
 * internal and user middleware at render time.
 *
 * The actual route dispatch (endpoint / redirect / page / fallback) is
 * supplied by the caller as `renderRouteCallback` — typically bound to a
 * `PagesHandler.handle`.
 */
export class AstroMiddleware {
	#pipeline: Pipeline;

	constructor(pipeline: Pipeline) {
		this.#pipeline = pipeline;
	}

	async handle(
		renderContext: RenderContext,
		componentInstance: ComponentInstance | undefined,
		slots: Record<string, any>,
		renderRouteCallback: RenderRouteCallback,
	): Promise<Response> {
		const pipeline = this.#pipeline;
		const { logger, manifest } = pipeline;
		const props =
			Object.keys(renderContext.props).length > 0
				? renderContext.props
				: await getProps({
						mod: componentInstance,
						routeData: renderContext.routeData,
						routeCache: pipeline.routeCache,
						pathname: renderContext.pathname,
						logger,
						serverLike: manifest.serverLike,
						base: manifest.base,
						trailingSlash: manifest.trailingSlash,
					});
		const actionApiContext = renderContext.createActionAPIContext();
		const apiContext = renderContext.createAPIContext(props, actionApiContext);

		renderContext.counter++;
		if (renderContext.counter === 4) {
			return new Response('Loop Detected', {
				// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/508
				status: 508,
				statusText:
					'Astro detected a loop where you tried to call the rewriting logic more than four times.',
			});
		}

		// Track componentInstance across rewrites. Rewrites inside `next()`
		// may replace the component, and middleware may call next() multiple times.
		const componentRef: ComponentRef = { current: componentInstance };

		const next = (ctx: APIContext, payload?: RewritePayload) =>
			renderRouteCallback(
				renderContext,
				componentRef,
				slots,
				props,
				actionApiContext,
				ctx,
				payload,
			);

		let response: Response;
		if (renderContext.skipMiddleware) {
			response = await next(apiContext);
		} else {
			const pipelineMiddleware = await pipeline.getMiddleware();
			const composed = sequence(...pipeline.internalMiddleware, pipelineMiddleware);
			response = await callMiddleware(composed, apiContext, next);
		}
		return this.#finalize(renderContext, response);
	}

	#finalize(renderContext: RenderContext, response: Response): Response {
		if (response.headers.get(ROUTE_TYPE_HEADER)) {
			response.headers.delete(ROUTE_TYPE_HEADER);
		}
		// LEGACY: we put cookies on the response object,
		// where the adapter might be expecting to read it.
		// New code should be using `app.render({ addCookieHeader: true })` instead.
		attachCookiesToResponse(response, renderContext.getCookies());
		return response;
	}
}
