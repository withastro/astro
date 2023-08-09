import type { Environment } from './render';
import { type RenderContext, tryRenderRoute} from './render';
import type { EndpointCallResult } from './endpoint';
import type { ComponentInstance, MiddlewareEndpointHandler, RouteType } from '../@types/astro';

type EndpointHandler = (
	originalRequest: Request,
	result: EndpointCallResult
) => Promise<Response> | Response;

/**
 * This is the basic class 
 */
export class Pipeline {
	env: Environment;
	onRequest?: MiddlewareEndpointHandler;
	endpointHandler?: EndpointHandler;

	constructor(env: Environment) {
		this.env = env;
	}

	setEndpointHandler(handler: EndpointHandler) {
		this.endpointHandler = handler;
	}

	setMiddlewareFunction(onRequest: MiddlewareEndpointHandler) {
		this.onRequest = onRequest;
	}

	async renderRoute(
		renderContext: RenderContext,
		componentInstance: ComponentInstance
	): Promise<Response> {
		const result = await tryRenderRoute(renderContext, this.env, componentInstance, this.onRequest);
		if (Pipeline.isEndpointResult(result, renderContext.route.type)) {
			if (!this.endpointHandler) {
				throw new Error('You must set the endpoint handler');
			}
			return this.endpointHandler(renderContext.request, result);
		} else {
			return result;
		}
	}

	static isEndpointResult(result: any, routeType: RouteType): result is EndpointCallResult {
		return !(result instanceof Response) && routeType === 'endpoint';
	}

	static isResponse(result: any, routeType: RouteType): result is Response {
		return result instanceof Response && (routeType === 'page' || routeType === 'redirect');
	}
}


