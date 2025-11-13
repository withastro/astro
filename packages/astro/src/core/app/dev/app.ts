import type { RoutesList } from '../../../types/astro.js';
import type { RouteData } from '../../../types/public/index.js';
import { MiddlewareNoDataOrNextCalled, MiddlewareNotAResponse } from '../../errors/errors-data.js';
import { type AstroError, isAstroError } from '../../errors/index.js';
import type { Logger } from '../../logger/core.js';
import type { CreateRenderContext, RenderContext } from '../../render-context.js';
import { isRoute404, isRoute500 } from '../../routing/match.js';
import { BaseApp, type RenderErrorOptions } from '../base.js';
import type { SSRManifest } from '../types.js';
import { DevPipeline } from './pipeline.js';

export class DevApp extends BaseApp<DevPipeline> {
	logger: Logger;
	currentRenderContext: RenderContext | undefined = undefined;
	constructor(manifest: SSRManifest, streaming = true, logger: Logger) {
		super(manifest, streaming, logger);
		this.logger = logger;
	}

	createPipeline(streaming: boolean, manifest: SSRManifest, logger: Logger): DevPipeline {
		return DevPipeline.create({
			logger,
			manifest,
			streaming,
		});
	}

	match(request: Request): RouteData | undefined {
		return super.match(request, true);
	}

	async createRenderContext(payload: CreateRenderContext): Promise<RenderContext> {
		this.currentRenderContext = await super.createRenderContext(payload);
		return this.currentRenderContext;
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
					pathname: this.getPathnameFromRequest(request),
					skipMiddleware,
					request,
					routeData,
					clientAddress,
					status,
					shouldInjectCspMetaTags: false,
				});
				renderContext.props.error = error;
				const response = await renderContext.render(preloadedComponent);

				if(error) {
					// Log useful information that the custom 500 page may not display unlike the default error overlay
					this.logger.error('router', (error as AstroError).stack || (error as AstroError).message);
				}
				
				return response;
			} catch (_err) {
				console.log("RENDERED ERROR", _err)
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

		if(status === 404) {
			const custom400 = getCustom400Route(this.manifestData);
			if(custom400) {
				return renderRoute(custom400);
			} else {
				throw new Error("COULD NOT FIND 404 COMPONENT");
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
}

function getCustom500Route(manifestData: RoutesList): RouteData | undefined {
	return manifestData.routes.find((r) => isRoute500(r.route));
}

function getCustom400Route(manifestData: RoutesList): RouteData | undefined {
	return manifestData.routes.find((r) => isRoute404(r.route));
}
