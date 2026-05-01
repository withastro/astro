import type { RouteData } from '../../../types/public/index.js';
import { MiddlewareNoDataOrNextCalled, MiddlewareNotAResponse } from '../../errors/errors-data.js';
import { type AstroError, isAstroError } from '../../errors/index.js';
import type { AstroLogger } from '../../logger/core.js';
import {
	BaseApp,
	type DevMatch,
	type LogRequestPayload,
	type RenderErrorOptions,
} from '../base.js';
import type { SSRManifest } from '../types.js';
import { NonRunnablePipeline } from './pipeline.js';
import { getCustom404Route, getCustom500Route } from '../../routing/helpers.js';
import { ensure404Route } from '../../routing/astro-designed-error-pages.js';
import { matchRoute } from '../../routing/dev.js';
import type { RunnablePipeline } from '../../../vite-plugin-app/pipeline.js';
import type { RoutesList } from '../../../types/astro.js';
import { req } from '../../messages/runtime.js';

export class DevApp extends BaseApp<NonRunnablePipeline> {
	constructor(manifest: SSRManifest, streaming = true, logger: AstroLogger) {
		super(manifest, streaming, logger);
	}

	createPipeline(
		streaming: boolean,
		manifest: SSRManifest,
		logger: AstroLogger,
	): NonRunnablePipeline {
		return NonRunnablePipeline.create({
			logger,
			manifest,
			streaming,
		});
	}

	isDev(): boolean {
		return true;
	}

	/**
	 * Clears the cached middleware so it is re-resolved on the next request.
	 * Called via HMR when middleware files change.
	 */
	clearMiddleware(): void {
		this.pipeline.clearMiddleware();
	}

	/**
	 * Updates the routes list when files change during development.
	 * Called via HMR when new pages are added/removed.
	 */
	updateRoutes(newRoutesList: RoutesList): void {
		this.manifestData = newRoutesList;
		ensure404Route(this.manifestData);
	}

	match(request: Request): RouteData | undefined {
		return super.match(request, true);
	}

	async devMatch(pathname: string): Promise<DevMatch | undefined> {
		const matchedRoute = await matchRoute(
			pathname,
			this.manifestData,
			this.pipeline as unknown as RunnablePipeline,
			this.manifest,
		);
		if (!matchedRoute) return undefined;

		return {
			routeData: matchedRoute.route,
			resolvedPathname: matchedRoute.resolvedPathname,
		};
	}

	async renderError(
		request: Request,
		{
			skipMiddleware = false,
			error,
			status,
			response: _response,
			...resolvedRenderOptions
		}: RenderErrorOptions,
	): Promise<Response> {
		// we always throw when we have Astro errors around the middleware
		if (
			isAstroError(error) &&
			[MiddlewareNoDataOrNextCalled.name, MiddlewareNotAResponse.name].includes(error.name)
		) {
			throw error;
		}

		const renderRoute = async (routeData: RouteData) => {
			try {
				const preloadedComponent = await this.pipeline.getComponentByRoute(routeData);
				const renderContext = await this.createRenderContext({
					locals: resolvedRenderOptions.locals,
					pipeline: this.pipeline,
					pathname: this.getPathnameFromRequest(request),
					skipMiddleware,
					request,
					routeData,
					clientAddress: resolvedRenderOptions.clientAddress,
					status,
					shouldInjectCspMetaTags: false,
				});
				renderContext.props.error = error;
				const response = await renderContext.render(preloadedComponent);

				if (error) {
					// Log useful information that the custom 500 page may not display unlike the default error overlay
					this.logger.error('router', (error as AstroError).stack || (error as AstroError).message);
				}

				return response;
			} catch (_err) {
				if (skipMiddleware === false) {
					return this.renderError(request, {
						...resolvedRenderOptions,
						status: 500,
						skipMiddleware: true,
						error: _err,
					});
				}
				// If even skipping the middleware isn't enough to prevent the error, show the dev overlay
				throw _err;
			}
		};

		if (status === 404) {
			const custom404 = getCustom404Route(this.manifestData);
			if (custom404) {
				return renderRoute(custom404);
			}
		}

		const custom500 = getCustom500Route(this.manifestData);

		// Show dev overlay
		if (!custom500) {
			throw error;
		} else {
			return renderRoute(custom500);
		}
	}

	logRequest({ pathname, method, statusCode, isRewrite, reqTime }: LogRequestPayload) {
		if (pathname === '/favicon.ico') {
			return;
		}
		this.logger.info(
			null,
			req({
				url: pathname,
				method,
				statusCode,
				isRewrite,
				reqTime,
			}),
		);
	}
}
