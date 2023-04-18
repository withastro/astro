import { sequence } from './sequence.js';
import { callMiddleware } from './callMiddleware.js';
import { loadMiddleware } from './loadMiddleware.js';
import type { MiddlewareResponseHandler } from '../../@types/astro';

function defineMiddleware(fn: MiddlewareResponseHandler) {
	return fn;
}

export { sequence, callMiddleware, loadMiddleware, defineMiddleware };
