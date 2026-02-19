import type { RouteData } from '../../../types/public/index.js';
import { MiddlewareNoDataOrNextCalled, MiddlewareNotAResponse } from '../../errors/errors-data.js';
import { type AstroError, isAstroError } from '../../errors/index.js';
import type { Logger } from '../../logger/core.js';
import type { CreateRenderContext, RenderContext } from '../../render-context.js';
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
	logger: Logger;
	resolvedPathname: string | undefined = undefined;
	constructor(manifest: SSRManifest, streaming = true, logger: Logger) {
		super(manifest, streaming, logger);
		this.logger = logger;
	}

	createPipeline(streaming: boolean, manifest: SSRManifest, logger: Logger): NonRunnablePipeline {
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

		this.resolvedPathname = matchedRoute.resolvedPathname;
		return {
			routeData: matchedRoute.route,
			resolvedPathname: matchedRoute.resolvedPathname,
		};
	}

	async createRenderContext(payload: CreateRenderContext): Promise<RenderContext> {
		return super.createRenderContext({
			...payload,
			pathname: this.resolvedPathname ?? payload.pathname,
		});
	}

	async renderError(
		request: Request,
		{ locals, skipMiddleware = false, error, clientAddress, status }: RenderErrorOptions,
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
					locals,
					pipeline: this.pipeline,
					pathname: await this.getPathnameFromRequest(request),
					skipMiddleware,
					request,
					routeData,
					clientAddress,
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
						clientAddress: undefined,
						prerenderedErrorPageFetch: fetch,
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
