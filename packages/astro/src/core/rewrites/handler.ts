import type { RouteData } from '../../types/public/internal.js';
import type { SSRManifest } from '../../types/public/index.js';
import type { Pipeline } from '../base-pipeline.js';
import type { AstroLogger } from '../logger/core.js';
import type { FetchState } from '../app/fetch-state.js';
import { clientAddressSymbol } from '../constants.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { copyRenderOptions, getRenderOptions } from '../app/render-options-store.js';
import { prepareForRender, renderErrorPage } from '../app/prepare.js';

export interface RewriteHandlerDeps {
	pipeline: Pipeline;
	manifest: SSRManifest;
	logger: AstroLogger;
}

/**
 * Creates a handler that processes pending rewrites from the FetchState.
 *
 * After downstream middleware (i18n, user code) sets `state.rewritePathname`,
 * this handler consumes it, resolves the rewrite target, and renders the
 * matched route. Returns `undefined` when no rewrite is pending.
 *
 * The `matchRouteData` callback is used to find a route for the rewritten URL.
 */
export function createRewritesHandler(
	deps: RewriteHandlerDeps,
	matchRouteData: (req: Request) => RouteData | undefined,
): (state: FetchState) => Promise<Response | undefined> {
	const { pipeline, manifest, logger } = deps;

	return async (state: FetchState): Promise<Response | undefined> => {
		const rewritePathname = state.rewritePathname;
		if (!rewritePathname) return undefined;

		const request = state.request;

		state.rewritePathname = undefined;
		state.rewriteCount += 1;
		if (state.rewriteCount >= 4) {
			return new Response('Loop Detected', {
				status: 508,
				statusText: 'Astro detected a loop where you tried to call the rewriting logic more than four times.',
			});
		}

		if (request.bodyUsed) {
			throw new AstroError(AstroErrorData.RewriteWithBodyUsed);
		}

		const ctx = await state.getAPIContext();

		const rewriteUrl = new URL(rewritePathname, request.url);
		const rewrittenRequest = new Request(rewriteUrl, request);
		copyRenderOptions(request, rewrittenRequest);
		const rewrittenRouteData = matchRouteData(rewrittenRequest);
		state.routeData = rewrittenRouteData;

		if (rewrittenRouteData) {
			const isDev = pipeline.runtimeMode === 'development';
			return prepareForRender(pipeline, manifest, pipeline.manifestData, logger, rewrittenRequest, rewrittenRouteData, {
				locals: ctx.locals,
				cookies: ctx.cookies,
				session: ctx.session as any,
				clientAddress: getRenderOptions(request)?.clientAddress ?? Reflect.get(request, clientAddressSymbol) as string | undefined,
				isDev,
			}, (renderContext, componentInstance) => renderContext.render(componentInstance));
		} else {
			return renderErrorPage(pipeline, manifest, pipeline.manifestData, logger, rewrittenRequest, {
				locals: ctx.locals,
				clientAddress: getRenderOptions(request)?.clientAddress ?? Reflect.get(request, clientAddressSymbol) as string | undefined,
				status: 404,
				isDev: pipeline.runtimeMode === 'development',
			});
		}
	};
}
