import type { ComponentInstance, EndpointHandler } from '../@types/astro.js';
import { renderEndpoint } from '../runtime/server/endpoint.js';
import { attachCookiesToResponse } from './cookies/response.js';
import { createAPIContext } from './endpoint/index.js';
import { callMiddleware } from './middleware/callMiddleware.js';
import { renderPage } from './render/core.js';
import { type Environment, type RenderContext } from './render/index.js';

/**
 * This is the basic class of a pipeline.
 *
 * Check the {@link ./README.md|README} for more information about the pipeline.
 */
export class Pipeline {
	constructor(
		readonly environment: Environment,
		readonly locals: App.Locals,
		readonly request: Request,
		readonly pathname: string,
		readonly renderContext: RenderContext,
		readonly middleware = environment.middleware
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
		Reflect.set(this.renderContext.request, Symbol.for('astro.routeData'), this.renderContext.route)
		const { renderContext, environment } = this;
		const { defaultLocale, locales, params, props, request, routing: routingStrategy } = renderContext;
		const { adapterName, logger, site, serverLike } = environment;
		const apiContext = createAPIContext({ adapterName, defaultLocale, locales, params, props, request, routingStrategy, site });
		const terminalNext = renderContext.route.type === 'endpoint'
			? () => renderEndpoint(componentInstance as any as EndpointHandler, apiContext, serverLike, logger)
			: () => renderPage({ mod: componentInstance, renderContext, env: environment, cookies: apiContext.cookies });
		const response = await callMiddleware(this.middleware, apiContext, terminalNext);
		attachCookiesToResponse(response, apiContext.cookies);
		return response;
	}
}
