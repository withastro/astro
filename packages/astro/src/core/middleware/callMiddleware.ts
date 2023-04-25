import type { APIContext, MiddlewareHandler, MiddlewareNext } from '../../@types/astro';
import { AstroError, AstroErrorData } from '../errors/index.js';

/**
 * Utility function that is in charge of calling the middleware
 *
 * It accepts a `R` generic, which usually the `Response` returned.
 * It is a generic because endpoints can return a different response.
 *
 * When calling a middleware, we provide a `resolve` function, this function might or
 * might not be called. Because of that, we use a `Promise.race` to understand which
 * promise is resolved first.
 *
 * If `resolve` is called first, we resolve the `responseFunction` and we pass that response
 * as resolved value to `resolve`. Finally, we resolve the middleware.
 * This logic covers examples like:
 *
 * ```js
 * const onRequest = async (context, resolve) => {
 *   const response = await resolve(context);
 *   return response;
 * }
 * ```
 *
 * If the middleware is called first, we return the response without fancy logic. This covers cases like:
 *
 * ```js
 * const onRequest = async (context, _) => {
 *   context.locals = "foo";
 * }
 * ```
 *
 * @param onRequest The function called which accepts a `context` and a `resolve` function
 * @param apiContext The API context
 * @param responseFunction A callback function that should return a promise with the response
 */
export async function callMiddleware<R>(
	onRequest: MiddlewareHandler<R>,
	apiContext: APIContext,
	responseFunction: () => Promise<R>
): Promise<Response | R> {
	let resolveResolve: any;
	new Promise((resolve) => {
		resolveResolve = resolve;
	});

	let nextCalled = false;
	const next: MiddlewareNext<R> = async () => {
		nextCalled = true;
		return await responseFunction();
	};

	let middlewarePromise = onRequest(apiContext, next);

	return await Promise.resolve(middlewarePromise).then(async (value) => {
		// first we check if `next` was called
		if (nextCalled) {
			/**
			 * Then we check if a value is returned. If so, we need to return the value returned by the
			 * middleware.
			 * e.g.
			 * ```js
			 * 	const response = await next();
			 * 	const new Response(null, { status: 500, headers: response.headers });
			 * ```
			 */
			if (typeof value !== 'undefined') {
				return value as R;
			} else {
				/**
				 * Here we handle the case where `next` was called and returned nothing.
				 */
				const responseResult = await responseFunction();
				return responseResult;
			}
		} else if (typeof value === 'undefined') {
			/**
			 * There might be cases where `next` isn't called and the middleware **must** return
			 * something.
			 *
			 * If not thing is returned, then we raise an Astro error.
			 */
			throw new AstroError(AstroErrorData.MiddlewareNoDataReturned);
		} else {
			// Middleware did not call resolve and returned a value
			return value as R;
		}
	});
}
