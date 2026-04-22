import type { FetchState } from '../app/fetch-state.js';
import type { RewritePayload } from '../../types/public/common.js';
import { AstroCookies } from '../cookies/index.js';
import { ForbiddenRewrite } from '../errors/errors-data.js';
import { AstroError } from '../errors/errors.js';
import { AstroMiddleware } from '../middleware/astro-middleware.js';
import { PagesHandler } from '../pages/handler.js';
import { getParams } from '../render/index.js';
import { copyRequest, setOriginPathname } from '../routing/rewrite.js';
import { createNormalizedUrl } from '../util/normalized-url.js';

/**
 * Executes a user-triggered rewrite (`Astro.rewrite(...)` /
 * `ctx.rewrite(...)`) against a `FetchState`. Resolves the rewrite
 * target via `pipeline.tryRewrite`, validates it (disallowing
 * SSR→prerender jumps except for i18n fallbacks), mutates the
 * `FetchState` to reflect the new route, and re-runs the middleware
 * and page dispatch to produce the new response.
 */
export class Rewrites {
	async execute(
		state: FetchState,
		payload: RewritePayload,
	): Promise<Response> {
		const pipeline = state.pipeline;
		pipeline.logger.debug('router', 'Calling rewrite: ', payload);
		const oldPathname = state.pathname;
		const { routeData, componentInstance, newUrl, pathname } = await pipeline.tryRewrite(
			payload,
			state.request,
		);
		// This is a case where the user tries to rewrite from a SSR route to a prerendered route (SSG).
		// This case isn't valid because when building for SSR, the prerendered route disappears from the server output because it becomes an HTML file,
		// so Astro can't retrieve it from the emitted manifest.
		// Allow i18n fallback rewrites - if the target route has fallback routes, this is likely an i18n scenario
		const isI18nFallback = routeData.fallbackRoutes && routeData.fallbackRoutes.length > 0;
		if (
			pipeline.manifest.serverLike &&
			!state.routeData!.prerender &&
			routeData.prerender &&
			!isI18nFallback
		) {
			throw new AstroError({
				...ForbiddenRewrite,
				message: ForbiddenRewrite.message(state.pathname, pathname, routeData.component),
				hint: ForbiddenRewrite.hint(routeData.component),
			});
		}

		state.routeData = routeData;
		if (payload instanceof Request) {
			state.request = payload;
		} else {
			state.request = copyRequest(
				newUrl,
				state.request,
				routeData.prerender,
				pipeline.logger,
				state.routeData!.route,
			);
		}
		state.url = createNormalizedUrl(state.request.url);
		const newCookies = new AstroCookies(state.request);
		if (state.cookies) {
			newCookies.merge(state.cookies);
		}
		state.cookies = newCookies;
		state.params = getParams(routeData, pathname);
		state.pathname = pathname;
		state.isRewriting = true;
		state.status = 200;
		state.componentInstance = componentInstance;

		setOriginPathname(
			state.request,
			oldPathname,
			pipeline.manifest.trailingSlash,
			pipeline.manifest.buildFormat,
		);

		// Props / API contexts are derived from the (now-changed) route;
		// drop the cached ones so they're re-built.
		state.invalidateContexts();

		const middleware = new AstroMiddleware(pipeline);
		const pagesHandler = new PagesHandler(pipeline);
		const mwState = await middleware.handle(state, pagesHandler.handle.bind(pagesHandler));
		return mwState;
	}
}
