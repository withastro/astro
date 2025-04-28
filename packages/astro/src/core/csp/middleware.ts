import type { MiddlewareHandler } from '../../types/public/index.js';

export function createCSPMiddleware(): MiddlewareHandler {
	return async (_, next) => {
		const response = await next();

		// Do something with the response

		return response;
	};
}
