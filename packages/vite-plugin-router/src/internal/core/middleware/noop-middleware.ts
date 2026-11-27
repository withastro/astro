import type { MiddlewareHandler } from '../../../index.js';

export const NOOP_MIDDLEWARE_FN: MiddlewareHandler = async (_ctx, next) => {
	const response = await next();
	return response;
};
