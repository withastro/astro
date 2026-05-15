import { AstroCookies } from '../cookies/index.js';
import { ForbiddenRewrite } from '../errors/errors-data.js';
import { AstroError } from '../errors/errors.js';
import { AstroMiddleware } from '../middleware/astro-middleware.js';
import { PagesHandler } from '../pages/handler.js';
import { getParams } from '../render/index.js';
import { copyRequest, setOriginPathname } from '../routing/rewrite.js';
import { createNormalizedUrl } from '../util/normalized-url.js';
function applyRewriteToState(
	state,
	payload,
	{ routeData, componentInstance, newUrl, pathname },
	{ mergeCookies = false } = {},
) {
	const pipeline = state.pipeline;
	const oldPathname = state.pathname;
	const isI18nFallback = routeData.fallbackRoutes && routeData.fallbackRoutes.length > 0;
	if (
		pipeline.manifest.serverLike &&
		!state.routeData.prerender &&
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
			state.routeData.route,
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
	state.invalidateContexts();
}
class Rewrites {
	async execute(state, payload) {
		const pipeline = state.pipeline;
		pipeline.logger.debug('router', 'Calling rewrite: ', payload);
		const result = await pipeline.tryRewrite(payload, state.request);
		applyRewriteToState(state, payload, result, { mergeCookies: true });
		const middleware = new AstroMiddleware(pipeline);
		const pagesHandler = new PagesHandler(pipeline);
		return middleware.handle(state, pagesHandler.handle.bind(pagesHandler));
	}
}
export { Rewrites, applyRewriteToState };
