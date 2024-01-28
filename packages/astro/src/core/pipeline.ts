import type { ComponentInstance, EndpointHandler, MiddlewareHandler } from '../@types/astro.js';
import { renderEndpoint } from '../runtime/server/endpoint.js';
import { attachCookiesToResponse } from './cookies/response.js';
import { createAPIContext } from './endpoint/index.js';
import { callMiddleware } from './middleware/callMiddleware.js';
import { renderPage } from './render/core.js';
import type { Environment, RenderContext } from './render/index.js';

/**
 * This is the basic class of a pipeline.
 *
 * Check the {@link ./README.md|README} for more information about the pipeline.
 */
export class Pipeline {
	constructor(
		readonly environment: Environment,
		readonly locals: App.Locals,
		readonly middleware: MiddlewareHandler,
		readonly pathname: string,
		readonly renderContext: RenderContext,
		readonly request = renderContext.request,
	) {}

	/**
	 * The main function of the pipeline. Use this function to render any route known to Astro;
	 * It attempts to render a route. A route can be a:
	 * - page
	 * - redirect
	 * - endpoint
	 *
	 * ## Errors
	 *
	 * It throws an error if the page can't be rendered.
	 */
	async renderRoute(
		componentInstance: ComponentInstance | undefined
	): Promise<Response> {
		const { renderContext, environment } = this;
		const { defaultLocale, locales, params, props, request, route: { route }, routing: routingStrategy } = renderContext;
		const { adapterName, logger, site, serverLike } = environment;
		const apiContext = createAPIContext({ adapterName, defaultLocale, locales, params, props, request, route, routingStrategy, site });
		HiddenPipeline.set(request, this);
		const terminalNext = renderContext.route.type === 'endpoint'
			? () => renderEndpoint(componentInstance as any as EndpointHandler, apiContext, serverLike, logger)
			: () => renderPage({ mod: componentInstance, renderContext, env: environment, cookies: apiContext.cookies });
		const response = await callMiddleware(this.middleware, apiContext, terminalNext);
		attachCookiesToResponse(response, apiContext.cookies);
		return response;
	}

	static get(request: Request) {
		return HiddenPipeline.get(request)
	}
}

/**
 * Allows internal middleware to read the pipeline associated with the current request.
 */
class HiddenPipeline extends class { constructor(request: Request) { return request } } {
	#pipeline!: Pipeline
	static get(request: Request) {
		if (#pipeline in request) return request.#pipeline 
		throw new Error("The request does not have an associated pipeline.")
	}
	static set(request: Request, pipeline: Pipeline) {
		// this if-branch only needs to exist until `App` starts reusing the original pipeline for `renderError()`
		// it can start to error afterwards as there shouldnt be multiple pipelines per request
		if (#pipeline in request)  {
			request.#pipeline = pipeline
		} else {
			const req = new HiddenPipeline(request)
			req.#pipeline = pipeline
		}
	}
}
