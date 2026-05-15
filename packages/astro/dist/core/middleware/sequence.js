import { pipelineSymbol } from '../constants.js';
import { ForbiddenRewrite } from '../errors/errors-data.js';
import { AstroError } from '../errors/index.js';
import { getParams } from '../render/index.js';
import { setOriginPathname } from '../routing/rewrite.js';
import { defineMiddleware } from './defineMiddleware.js';
function sequence(...handlers) {
	const filtered = handlers.filter((h) => !!h);
	const length = filtered.length;
	if (!length) {
		return defineMiddleware((_context, next) => {
			return next();
		});
	}
	return defineMiddleware((context, next) => {
		let carriedPayload = void 0;
		return applyHandle(0, context);
		function applyHandle(i, handleContext) {
			const handle = filtered[i];
			const result = handle(handleContext, async (payload) => {
				if (i < length - 1) {
					if (payload) {
						let newRequest;
						if (payload instanceof Request) {
							newRequest = payload;
						} else if (payload instanceof URL) {
							newRequest = new Request(payload, handleContext.request.clone());
						} else {
							newRequest = new Request(
								new URL(payload, handleContext.url.origin),
								handleContext.request.clone(),
							);
						}
						const oldPathname = handleContext.url.pathname;
						const pipeline = Reflect.get(handleContext, pipelineSymbol);
						const { routeData, pathname } = await pipeline.tryRewrite(
							payload,
							handleContext.request,
						);
						if (
							pipeline.manifest.serverLike === true &&
							handleContext.isPrerendered === false &&
							routeData.prerender === true
						) {
							throw new AstroError({
								...ForbiddenRewrite,
								message: ForbiddenRewrite.message(
									handleContext.url.pathname,
									pathname,
									routeData.component,
								),
								hint: ForbiddenRewrite.hint(routeData.component),
							});
						}
						carriedPayload = payload;
						handleContext.request = newRequest;
						handleContext.url = new URL(newRequest.url);
						handleContext.params = getParams(routeData, pathname);
						handleContext.routePattern = routeData.route;
						setOriginPathname(
							handleContext.request,
							oldPathname,
							pipeline.manifest.trailingSlash,
							pipeline.manifest.buildFormat,
						);
					}
					return applyHandle(i + 1, handleContext);
				} else {
					return next(payload ?? carriedPayload);
				}
			});
			return result;
		}
	});
}
export { sequence };
