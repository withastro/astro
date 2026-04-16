import type { BaseApp, RenderErrorOptions } from '../app/base.js';
import { FetchState } from '../app/fetch-state.js';
import type { RouteData } from '../../types/public/index.js';
import { getCustom404Route, getCustom500Route } from '../routing/helpers.js';
import { type AstroError, isAstroError } from './index.js';
import { MiddlewareNoDataOrNextCalled, MiddlewareNotAResponse } from './errors-data.js';
import type { ErrorHandler } from './handler.js';

export interface DevErrorHandlerOptions {
	/**
	 * Whether to inject CSP meta tags into the rendered error page response.
	 * The Vite dev server injects them; the non-runnable dev pipeline does not.
	 */
	shouldInjectCspMetaTags: boolean;
}

/**
 * The dev-server error handler. Renders custom 404/500 routes if the user
 * has them, otherwise throws so Vite's dev overlay is shown. Shared between
 * the Vite dev server (`AstroServerApp`) and the non-runnable dev pipeline
 * (`DevApp`); only `shouldInjectCspMetaTags` differs between them.
 */
export class DevErrorHandler implements ErrorHandler {
	#app: BaseApp<any>;
	#shouldInjectCspMetaTags: boolean;

	constructor(app: BaseApp<any>, options: DevErrorHandlerOptions) {
		this.#app = app;
		this.#shouldInjectCspMetaTags = options.shouldInjectCspMetaTags;
	}

	async renderError(
		request: Request,
		{
			skipMiddleware = false,
			error,
			status,
			response: _response,
			pathname,
			...resolvedRenderOptions
		}: RenderErrorOptions,
	): Promise<Response> {
		// we always throw when we have Astro errors around the middleware
		if (
			isAstroError(error) &&
			[MiddlewareNoDataOrNextCalled.name, MiddlewareNotAResponse.name].includes(
				(error as any).name,
			)
		) {
			throw error;
		}

		const app = this.#app;
		const shouldInjectCspMetaTags = this.#shouldInjectCspMetaTags;
		const resolvedPathname = pathname ?? new FetchState(app, request).pathname;

		const renderRoute = async (routeData: RouteData): Promise<Response> => {
			try {
				const preloadedComponent = await app.pipeline.getComponentByRoute(routeData);
				const renderContext = await app.createRenderContext({
					locals: resolvedRenderOptions.locals,
					pipeline: app.pipeline,
					pathname: resolvedPathname,
					skipMiddleware,
					request,
					routeData,
					clientAddress: resolvedRenderOptions.clientAddress,
					status,
					shouldInjectCspMetaTags: shouldInjectCspMetaTags ? !!app.manifest.csp : false,
				});
				renderContext.props.error = error;
				const response = await renderContext.render(preloadedComponent);

				if (error) {
					// Log useful information that the custom 500 page may not display unlike the default error overlay
					app.logger.error(
						'router',
						(error as AstroError).stack || (error as AstroError).message,
					);
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
				// If even skipping the middleware isn't enough to prevent the error, show the dev overlay
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

		// Show dev overlay
		if (!custom500) {
			throw error;
		} else {
			return renderRoute(custom500);
		}
	}
}
