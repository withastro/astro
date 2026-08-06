import type { ComponentInstance } from '../../types/astro.js';
import type { FetchState } from '../fetch/fetch-state.js';
import type { RewritePayload } from '../../types/public/common.js';
import type { RouteData } from '../../types/public/internal.js';
import { AstroCookies } from '../cookies/index.js';
import { ForbiddenRewrite } from '../errors/errors-data.js';
import { AstroError } from '../errors/errors.js';
import { AstroMiddleware } from '../middleware/astro-middleware.js';
import { PagesHandler } from '../pages/handler.js';
import { getParams } from '../render/index.js';
import { copyRequest, setOriginPathname } from '../routing/rewrite.js';
import { createNormalizedUrl } from '../util/normalized-url.js';

interface TryRewriteResult {
	routeData: RouteData;
	componentInstance: ComponentInstance;
	newUrl: URL;
	pathname: string;
}

/**
 * Validates and applies a rewrite target to the given `FetchState`.
 *
 * - Validates that SSR→prerender rewrites are not attempted (except
 *   for i18n fallback routes).
 * - Mutates `state` to reflect the new route: request, URL, cookies,
 *   params, pathname, component instance, etc.
 * - Invalidates cached API contexts so they're re-derived from the
 *   new route.
 *
 * Called by both `Rewrites.execute()` (user-triggered `Astro.rewrite`)
 * and `AstroMiddleware` (middleware `next(payload)`).
 */
export function applyRewriteToState(
	state: FetchState,
	payload: RewritePayload,
	{ routeData, componentInstance, newUrl, pathname }: TryRewriteResult,
	{ mergeCookies = false }: { mergeCookies?: boolean } = {},
): void {
	const pipeline = state.pipeline;
	const oldPathname = state.pathname;

	// Disallow SSR→prerender rewrites: the prerendered route becomes a
	// static HTML file during build and isn't available in the server
	// manifest. Allow i18n fallback routes as an exception.
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
	state.componentInstance = componentInstance;
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
	if (mergeCookies) {
		const newCookies = new AstroCookies(state.request);
		if (state.cookies) {
			newCookies.merge(state.cookies);
		}
		state.cookies = newCookies;
	}
	state.params = getParams(routeData, pathname);
	state.pathname = pathname;
	state.isRewriting = true;
	state.status = 200;

	setOriginPathname(
		state.request,
		oldPathname,
		pipeline.manifest.trailingSlash,
		pipeline.manifest.buildFormat,
	);

	// Props / API contexts are derived from the (now-changed) route;
	// drop the cached ones so they're re-built.
	state.invalidateContexts();
}

/**
 * Executes a user-triggered rewrite (`Astro.rewrite(...)` /
 * `ctx.rewrite(...)`) against a `FetchState`. Resolves the rewrite
 * target via `pipeline.tryRewrite`, validates it, mutates the
 * `FetchState` to reflect the new route, and re-runs the middleware
 * and page dispatch to produce the new response.
 */
export class Rewrites {
	async execute(state: FetchState, payload: RewritePayload): Promise<Response> {
		const pipeline = state.pipeline;
		pipeline.logger.debug('router', 'Calling rewrite: ', payload);
		const result = await pipeline.tryRewrite(payload, state.request);
		applyRewriteToState(state, payload, result, { mergeCookies: true });

		const middleware = new AstroMiddleware(pipeline);
		const pagesHandler = new PagesHandler(pipeline);
		return middleware.handle(state, pagesHandler.handle.bind(pagesHandler));
	}
}
