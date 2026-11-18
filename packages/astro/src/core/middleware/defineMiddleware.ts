import type { MiddlewareHandler } from '../../types/public/common.js';

export function defineMiddleware(fn: MiddlewareHandler) {
	return fn;
}
