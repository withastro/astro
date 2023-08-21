import type { Environment } from '../render';
import { Pipeline } from '../pipeline.js';

/**
 * Thrown when an endpoint contains a response with the header "X-Astro-Response" === 'Not-Found'
 */
export class EndpointNotFoundError extends Error {
	originalResponse: Response;
	constructor(originalResponse: Response) {
		super();
		this.originalResponse = originalResponse;
	}
}

export class SSRRoutePipeline extends Pipeline {
	constructor(env: Environment) {
		super(env);
		this.setEndpointHandler(this.#ssrEndpointHandler);
	}

	// This function is responsible for handling the result coming from an endpoint.
	async #ssrEndpointHandler(request: Request, response: Response): Promise<Response> {
		if (response.headers.get('X-Astro-Response') === 'Not-Found') {
			throw new EndpointNotFoundError(response);
		}
		return response
	}
}
