import type { RouteData } from '../../../types/public/internal.js';
import type { Pipeline } from '../../base-pipeline.js';
import type { Logger } from '../../logger/core.js';
import type { APIContext } from '../../../types/public/context.js';
import { renderEndpoint } from '../../../runtime/server/endpoint.js';

/**
 * Renders endpoint routes. This class is framework-agnostic and does not
 * depend on Hono APIs; callers provide a Request, APIContext, and route data.
 */
export class EndpointRenderer {
	#pipeline: Pipeline;
	#logger: Logger;

	constructor(pipeline: Pipeline, logger: Logger) {
		this.#pipeline = pipeline;
		this.#logger = logger;
	}

	async render(routeData: RouteData, apiContext: APIContext): Promise<Response> {
		const componentInstance = await this.#pipeline.getComponentByRoute(routeData);
		return renderEndpoint(
			componentInstance as any,
			apiContext,
			routeData.prerender,
			this.#logger,
		);
	}
}
