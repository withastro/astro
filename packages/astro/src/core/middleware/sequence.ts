import type { APIContext, MiddlewareHandler, MiddlewareResponseHandler } from '../../@types/astro';
import { defineMiddleware } from './index.js';

/**
 * From SvelteKit: https://github.com/sveltejs/kit/blob/master/packages/kit/src/exports/hooks/sequence.js
 *
 * It accepts one or more middleware handlers and makes sure that they are run in sequence.
 */
export function sequence(...handlers: MiddlewareResponseHandler[]): MiddlewareResponseHandler {
	const length = handlers.length;
	if (!length) {
		const handler: MiddlewareResponseHandler = defineMiddleware((context, next) => {
			return next();
		});
		return handler;
	}

	return defineMiddleware((context, next) => {
		return applyHandle(0, context);

		function applyHandle(i: number, handleContext: APIContext) {
			const handle = handlers[i];
			const result = handle(handleContext, async () => {
				if (i < length - 1) {
					const applyHandlePromise = applyHandle(i + 1, handleContext);
					if (applyHandlePromise) {
						const applyHandleResult = await applyHandlePromise;
						if (applyHandleResult) {
							return applyHandleResult;
						} else {
							return next();
						}
					} else {
						return next();
					}
				} else {
					return next();
				}
			});
			return result;
		}
	});
}
