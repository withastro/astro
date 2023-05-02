import { sequence } from './sequence.js';
import type { MiddlewareResponseHandler } from '../../@types/astro';

function defineMiddleware(fn: MiddlewareResponseHandler) {
	return fn;
}

// NOTE: this export must export only the functions that will be exposed to user-land as officials APIs
export { sequence, defineMiddleware };
