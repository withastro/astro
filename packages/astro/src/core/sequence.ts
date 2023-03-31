import type { APIContext, OnBeforeRequestHook } from '../@types/astro';

export function sequence(...handlers: OnBeforeRequestHook[]): OnBeforeRequestHook {
	const length = handlers.length;
	if (!length) return (context, resolve) => resolve(context);

	return (context, resolve) => {
		return apply_handle(0, context);

		/**
		 * @param {number} i
		 * @param {import('types').RequestEvent} event
		 * @param {import('types').ResolveOptions | undefined} parent_options
		 * @returns {import('types').MaybePromise<Response>}
		 */
		function apply_handle(i: number, handleContext: APIContext): Promise<Response> {
			const handle = handlers[i];

			return handle(handleContext, (nextContext) => {
				return i < length - 1 ? apply_handle(i + 1, nextContext) : resolve(nextContext);
			});
		}
	};
}
