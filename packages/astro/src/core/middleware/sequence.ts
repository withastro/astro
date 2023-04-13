import type { APIContext, MiddlewareHandler } from '../../@types/astro';

/**
 * From SvelteKit: https://github.com/sveltejs/kit/blob/master/packages/kit/src/exports/hooks/sequence.js
 *
 * It accepts one or more middleware handlers and makes sure that they are run in sequence.
 */
export function sequence<R>(...handlers: MiddlewareHandler<R>[]): MiddlewareHandler<R> {
	const length = handlers.length;
	if (!length) {
		const handler: MiddlewareHandler<R> = (context, resolve) => {
			return resolve();
		};
		return handler;
	}

	return (context, resolve) => {
		return applyHandle(0, context);

		function applyHandle(i: number, handleContext: APIContext): Promise<R> {
			const handle = handlers[i];

			return handle(handleContext, () => {
				if (i < length - 1) {
					return applyHandle(i + 1, handleContext);
				} else {
					return resolve();
				}
			});
		}
	};
}
