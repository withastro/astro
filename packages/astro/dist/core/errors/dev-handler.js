import { FetchState } from '../fetch/fetch-state.js';
import { AstroMiddleware } from '../middleware/astro-middleware.js';
import { PagesHandler } from '../pages/handler.js';
import { getCustom404Route, getCustom500Route } from '../routing/helpers.js';
import { isAstroError } from './index.js';
import { MiddlewareNoDataOrNextCalled, MiddlewareNotAResponse } from './errors-data.js';
class DevErrorHandler {
	#app;
	#shouldInjectCspMetaTags;
	#astroMiddleware;
	#pagesHandler;
	constructor(app, options) {
		this.#app = app;
		this.#shouldInjectCspMetaTags = options.shouldInjectCspMetaTags;
		this.#astroMiddleware = new AstroMiddleware(app.pipeline);
		this.#pagesHandler = new PagesHandler(app.pipeline);
	}
	async renderError(
		request,
		{
			skipMiddleware = false,
			error,
			status,
			response: _response,
			pathname,
			...resolvedRenderOptions
		},
	) {
		if (
			isAstroError(error) &&
			[MiddlewareNoDataOrNextCalled.name, MiddlewareNotAResponse.name].includes(error.name)
		) {
			throw error;
		}
		const app = this.#app;
		const shouldInjectCspMetaTags = this.#shouldInjectCspMetaTags;
		const resolvedPathname = pathname ?? new FetchState(app.pipeline, request).pathname;
		const renderRoute = async (routeData) => {
			try {
				const preloadedComponent = await app.pipeline.getComponentByRoute(routeData);
				const errorState = new FetchState(app.pipeline, request);
				errorState.skipMiddleware = skipMiddleware;
				errorState.clientAddress = resolvedRenderOptions.clientAddress;
				errorState.shouldInjectCspMetaTags = shouldInjectCspMetaTags ? !!app.manifest.csp : false;
				errorState.routeData = routeData;
				errorState.pathname = resolvedPathname;
				errorState.status = status;
				errorState.componentInstance = preloadedComponent;
				errorState.locals = resolvedRenderOptions.locals ?? {};
				errorState.initialProps = { error };
				const response = await this.#astroMiddleware.handle(
					errorState,
					this.#pagesHandler.handle.bind(this.#pagesHandler),
				);
				if (error) {
					app.logger.error('router', error.stack || error.message);
				}
				return response;
			} catch (_err) {
				if (skipMiddleware === false) {
					return this.renderError(request, {
						...resolvedRenderOptions,
						status: 500,
						skipMiddleware: true,
						error: _err,
						pathname: resolvedPathname,
					});
				}
				throw _err;
			}
		};
		if (status === 404) {
			const custom404 = getCustom404Route(app.manifestData);
			if (custom404) {
				return renderRoute(custom404);
			}
		}
		const custom500 = getCustom500Route(app.manifestData);
		if (!custom500) {
			throw error;
		} else {
			return renderRoute(custom500);
		}
	}
}
export { DevErrorHandler };
