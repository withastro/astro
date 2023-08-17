import type { Environment } from '../render';
import type { EndpointCallResult } from '../endpoint/index.js';
import mime from 'mime';
import { attachCookiesToResponse } from '../cookies/index.js';
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
	#encoder = new TextEncoder();

	constructor(env: Environment) {
		super(env);
		this.setEndpointHandler(this.#ssrEndpointHandler);
	}

	// This function is responsible for handling the result coming from an endpoint.
	async #ssrEndpointHandler(request: Request, response: EndpointCallResult): Promise<Response> {
		if (response.type === 'response') {
			if (response.response.headers.get('X-Astro-Response') === 'Not-Found') {
				throw new EndpointNotFoundError(response.response);
			}
			return response.response;
		} else {
			const url = new URL(request.url);
			const headers = new Headers();
			const mimeType = mime.getType(url.pathname);
			if (mimeType) {
				headers.set('Content-Type', `${mimeType};charset=utf-8`);
			} else {
				headers.set('Content-Type', 'text/plain;charset=utf-8');
			}
			const bytes =
				response.encoding !== 'binary' ? this.#encoder.encode(response.body) : response.body;
			headers.set('Content-Length', bytes.byteLength.toString());

			const newResponse = new Response(bytes, {
				status: 200,
				headers,
			});
			attachCookiesToResponse(newResponse, response.cookies);
			return newResponse;
		}
	}
}
