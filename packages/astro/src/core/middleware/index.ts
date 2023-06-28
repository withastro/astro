import type { MiddlewareResponseHandler, Params } from '../../@types/astro';
import { sequence } from './sequence.js';
import { createAPIContext } from '../endpoint/index.js';

function defineMiddleware(fn: MiddlewareResponseHandler) {
	return fn;
}

/**
 * Payload for creating a context to be passed to Astro middleware
 */
export type CreateContext = {
	/**
	 * The incoming request
	 */
	request: Request;
	/**
	 * Optional parameters
	 */
	params?: Params;
};

/**
 * Creates a context to be passed to Astro middleware `onRequest` function.
 */
function createContext({ request, params }: CreateContext) {
	return createAPIContext({
		request,
		params: params ?? {},
		props: {},
		site: undefined,
	});
}

// NOTE: this export must export only the functions that will be exposed to user-land as officials APIs
export { sequence, defineMiddleware, createContext };
