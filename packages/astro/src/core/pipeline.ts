import type { ComponentInstance, EndpointHandler, MiddlewareHandler } from '../@types/astro.js';
import { callEndpoint, createAPIContext } from './endpoint/index.js';
import { callMiddleware } from './middleware/callMiddleware.js';
import { renderPage } from './render/core.js';
import { type Environment, type RenderContext } from './render/index.js';

export type PipelineHookFunction = (ctx: RenderContext, mod: ComponentInstance | undefined) => void;

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
		readonly hookBefore: PipelineHookFunction = () => {},
		private middleware = environment.middleware
	) {}

	/**
	 * A middleware function that will be called before each request.
	 */
	setMiddlewareFunction(middleware: MiddlewareHandler) {
		this.middleware = middleware;
	}

	/**
	 * Removes the current middleware function. Subsequent requests won't trigger any middleware.
	 */
	unsetMiddlewareFunction() {
		this.middleware = (_, next) => next();
	}

	/**
	 * The main function of the pipeline. Use this function to render any route known to Astro;
	 */
	async renderRoute(
		componentInstance: ComponentInstance | undefined
	): Promise<Response> {
		this.hookBefore(this.renderContext, componentInstance);
		return await this.#tryRenderRoute(componentInstance, this.middleware);
	}

	/**
	 * It attempts to render a route. A route can be a:
	 * - page
	 * - redirect
	 * - endpoint
	 *
	 * ## Errors
	 *
	 * It throws an error if the page can't be rendered.
	 */
	async #tryRenderRoute(
		mod: Readonly<ComponentInstance> | undefined,
		onRequest?: MiddlewareHandler
	): Promise<Response> {
		const { renderContext, environment } = this;
		const { defaultLocale, locales, params, props, request, routing: routingStrategy } = renderContext;
		const { adapterName, site } = environment;
		const apiContext = createAPIContext({ adapterName, defaultLocale, locales, params, props, request, routingStrategy, site });

		switch (renderContext.route.type) {
			case 'page':
			case 'fallback':
			case 'redirect': {
				if (onRequest) {
					return await callMiddleware(onRequest, apiContext, () => {
						return renderPage({
							mod,
							renderContext,
							env: environment,
							cookies: apiContext.cookies,
						});
					});
				} else {
					return await renderPage({
						mod,
						renderContext,
						env: environment,
						cookies: apiContext.cookies,
					});
				}
			}
			case 'endpoint': {
				return await callEndpoint(mod as any as EndpointHandler, environment, renderContext, onRequest);
			}
			default:
				throw new Error(`Couldn't find route of type [${renderContext.route.type}]`);
		}
	}
}
