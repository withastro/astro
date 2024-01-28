import type { ComponentInstance, EndpointHandler, MiddlewareHandler } from '../@types/astro.js';
import { callEndpoint, createAPIContext } from './endpoint/index.js';
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
		const { adapterName, site } = environment;
		const apiContext = createAPIContext({ adapterName, defaultLocale, locales, params, props, request, routingStrategy, site });

		switch (renderContext.route.type) {
			case 'page':
			case 'fallback':
			case 'redirect': {
				return await callMiddleware(this.middleware, apiContext, () => renderPage({
						mod: componentInstance,
						renderContext,
						env: environment,
						cookies: apiContext.cookies,
					}))
			}
			case 'endpoint': {
				return await callEndpoint(componentInstance as any as EndpointHandler, environment, renderContext, this.middleware);
			}
			default:
				throw new Error(`Couldn't find route of type [${renderContext.route.type}]`);
		}
	}
}
