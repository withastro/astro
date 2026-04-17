import type { RewritePayload } from '../../types/public/common.js';
import { AstroCookies } from '../cookies/index.js';
import { ForbiddenRewrite } from '../errors/errors-data.js';
import { AstroError } from '../errors/errors.js';
import { AstroMiddleware } from '../middleware/astro-middleware.js';
import { PagesHandler } from '../pages/handler.js';
import { RenderContext } from '../render-context.js';
import { getParams } from '../render/index.js';
import { copyRequest, setOriginPathname } from '../routing/rewrite.js';

/**
 * Executes a user-triggered rewrite (`Astro.rewrite(...)` /
 * `ctx.rewrite(...)`) against a `RenderContext`. Resolves the rewrite
 * target via `pipeline.tryRewrite`, validates it (disallowing
 * SSR→prerender jumps except for i18n fallbacks), mutates the
 * `RenderContext` to reflect the new route, and re-runs the middleware
 * and page dispatch to produce the new response.
 *
 * This is the "legacy" rewrite path that mutates an existing
 * `RenderContext` and re-enters middleware. It is used when no
 * `rewriteOverride` is set on the context — i.e. by error handlers and
 * the container API. `AstroHandler` installs its own override that
 * recurses through the handler pipeline with a fresh `RenderContext`
 * instead (see `AstroHandler.#rewriteAndRender`).
 */
export class Rewrites {
	async execute(renderContext: RenderContext, payload: RewritePayload): Promise<Response> {
		const pipeline = renderContext.pipeline;
		pipeline.logger.debug('router', 'Calling rewrite: ', payload);
		const oldPathname = renderContext.pathname;
		const { routeData, componentInstance, newUrl, pathname } = await pipeline.tryRewrite(
			payload,
			renderContext.request,
		);
		// This is a case where the user tries to rewrite from a SSR route to a prerendered route (SSG).
		// This case isn't valid because when building for SSR, the prerendered route disappears from the server output because it becomes an HTML file,
		// so Astro can't retrieve it from the emitted manifest.
		// Allow i18n fallback rewrites - if the target route has fallback routes, this is likely an i18n scenario
		const isI18nFallback = routeData.fallbackRoutes && routeData.fallbackRoutes.length > 0;
		if (
			pipeline.manifest.serverLike &&
			!renderContext.routeData.prerender &&
			routeData.prerender &&
			!isI18nFallback
		) {
			throw new AstroError({
				...ForbiddenRewrite,
				message: ForbiddenRewrite.message(renderContext.pathname, pathname, routeData.component),
				hint: ForbiddenRewrite.hint(routeData.component),
			});
		}

		renderContext.routeData = routeData;
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
		renderContext.url = RenderContext.createNormalizedUrl(renderContext.request.url);
		const newCookies = new AstroCookies(renderContext.request);
		const existingCookies = renderContext.getCookies();
		if (existingCookies) {
			newCookies.merge(existingCookies);
		}
		renderContext.cookies = newCookies;
		renderContext.params = getParams(routeData, pathname);
		renderContext.pathname = pathname;
		renderContext.isRewriting = true;
		// we found a route and a component, we can change the status code to 200
		renderContext.status = 200;
		setOriginPathname(
			renderContext.request,
			oldPathname,
			pipeline.manifest.trailingSlash,
			pipeline.manifest.buildFormat,
		);
		const middleware = new AstroMiddleware(pipeline);
		const pagesHandler = new PagesHandler(pipeline);
		return await middleware.handle(
			renderContext,
			componentInstance,
			{},
			pagesHandler.handle.bind(pagesHandler),
		);
	}
}
