import { type RenderContext, type Environment } from './render/index.js';
import { type EndpointCallResult, callEndpoint, createAPIContext } from './endpoint/index.js';
import type {
	MiddlewareHandler,
	MiddlewareResponseHandler,
	ComponentInstance,
	MiddlewareEndpointHandler,
	RouteType,
	EndpointHandler,
} from '../@types/astro';
import { callMiddleware } from './middleware/callMiddleware.js';
import { renderPage } from './render/core.js';

type EndpointResultHandler = (
	originalRequest: Request,
	result: EndpointCallResult
) => Promise<Response> | Response;

/**
 * This is the basic class of a pipeline.
 *
 * Check the {@link ./README.md|README} for more information about the pipeline.
 */
export class Pipeline {
	env: Environment;
	onRequest?: MiddlewareEndpointHandler;
	/**
	 * The handler accepts the *original* `Request` and result returned by the endpoint.
	 * It must return a `Response`.
	 */
	endpointHandler?: EndpointResultHandler;

	/**
	 * When creating a pipeline, an environment is mandatory.
	 * The environment won't change for the whole lifetime of the pipeline.
	 */
	constructor(env: Environment) {
		this.env = env;
	}

	/**
	 * When rendering a route, an "endpoint" will a type that needs to be handled and transformed into a `Response`.
	 *
	 * Each consumer might have different needs; use this function to set up the handler.
	 */
	setEndpointHandler(handler: EndpointResultHandler) {
		this.endpointHandler = handler;
	}

	/**
	 * A middleware function that will be called before each request.
	 */
	setMiddlewareFunction(onRequest: MiddlewareEndpointHandler) {
		this.onRequest = onRequest;
	}

	/**
	 * The main function of the pipeline. Use this function to render any route known to Astro;
	 */
	async renderRoute(
		renderContext: RenderContext,
		componentInstance: ComponentInstance
	): Promise<Response> {
		const result = await this.#tryRenderRoute(
			renderContext,
			this.env,
			componentInstance,
			this.onRequest
		);
		if (Pipeline.isEndpointResult(result, renderContext.route.type)) {
			if (!this.endpointHandler) {
				throw new Error(
					'You created a pipeline that does not know how to handle the result coming from an endpoint.'
				);
			}
			return this.endpointHandler(renderContext.request, result);
		} else {
			return result;
		}
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
	async #tryRenderRoute<MiddlewareReturnType = Response>(
		renderContext: Readonly<RenderContext>,
		env: Readonly<Environment>,
		mod: Readonly<ComponentInstance>,
		onRequest?: MiddlewareHandler<MiddlewareReturnType>
	): Promise<Response | EndpointCallResult> {
		const apiContext = createAPIContext({
			request: renderContext.request,
			params: renderContext.params,
			props: renderContext.props,
			site: env.site,
			adapterName: env.adapterName,
		});

		switch (renderContext.route.type) {
			case 'page':
			case 'redirect': {
				if (onRequest) {
					return await callMiddleware<Response>(
						env.logging,
						onRequest as MiddlewareResponseHandler,
						apiContext,
						() => {
							return renderPage({
								mod,
								renderContext,
								env,
								cookies: apiContext.cookies,
							});
						}
					);
				} else {
					return await renderPage({
						mod,
						renderContext,
						env,
						cookies: apiContext.cookies,
					});
				}
			}
			case 'endpoint': {
				const result = await callEndpoint(
					mod as any as EndpointHandler,
					env,
					renderContext,
					onRequest
				);
				return result;
			}
			default:
				throw new Error(`Couldn't find route of type [${renderContext.route.type}]`);
		}
	}

	/**
	 * Use this function
	 */
	static isEndpointResult(result: any, routeType: RouteType): result is EndpointCallResult {
		return !(result instanceof Response) && routeType === 'endpoint';
	}

	static isResponse(result: any, routeType: RouteType): result is Response {
		return result instanceof Response && (routeType === 'page' || routeType === 'redirect');
	}
}
