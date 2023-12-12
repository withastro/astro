import type { APIContext, MiddlewareHandler } from '../../@types/astro.js';
import { defineMiddleware } from './index.js';

// From SvelteKit: https://github.com/sveltejs/kit/blob/master/packages/kit/src/exports/hooks/sequence.js
/**
 *
 * It accepts one or more middleware handlers and makes sure that they are run in sequence.
 */
export function sequence(...handlers: MiddlewareHandler[]): MiddlewareHandler {
	const filtered = handlers.filter((h) => !!h);
	const length = filtered.length;
	if (!length) {
		const handler: MiddlewareHandler = defineMiddleware((context, next) => {
			return next();
		});
		return handler;
	}

	return defineMiddleware((context, next) => {
		return applyHandle(0, context);

		function applyHandle(i: number, handleContext: APIContext) {
			const handle = filtered[i];
			// @ts-expect-error
			// SAFETY: Usually `next` always returns something in user land, but in `sequence` we are actually
			// doing a loop over all the `next` functions, and eventually we call the last `next` that returns the `Response`.
			const result = handle(handleContext, async () => {
				if (i < length - 1) {
					return applyHandle(i + 1, handleContext);
				} else {
					return next();
				}
			});
			return result;
		}
	});
}
