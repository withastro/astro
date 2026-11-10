import type { MiddlewareHandler } from '../../../index.js';

export function defineMiddleware(fn: MiddlewareHandler) {
	return fn;
}
