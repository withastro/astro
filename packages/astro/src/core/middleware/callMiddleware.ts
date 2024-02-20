import type { APIContext, MiddlewareHandler } from '../../@types/astro.js';
import { AstroError, AstroErrorData } from '../errors/index.js';

/**
 * Utility function that is in charge of calling the middleware.
 *
 * It accepts a `R` generic, which usually is the `Response` returned.
 * It is a generic because endpoints can return a different payload.
 *
 * When calling a middleware, we provide a `next` function, this function might or
 * might not be called.
 *
 * A middleware, to behave correctly, can:
 * - return a `Response`;
 * - call `next`;
 *
 * Failing doing so will result an error. A middleware can call `next` and do not return a
 * response. A middleware can not call `next` and return a new `Response` from scratch (maybe with a redirect).
 *
 * ```js
 * const onRequest = async (context, next) => {
 *   const response = await next(context);
 *   return response;
 * }
 * ```
 *
 * ```js
 * const onRequest = async (context, next) => {
 *   context.locals = "foo";
 *   next();
 * }
 * ```
 *
 * @param onRequest The function called which accepts a `context` and a `resolve` function
 * @param apiContext The API context
 * @param responseFunction A callback function that should return a promise with the response
 */
export async function callMiddleware(
	onRequest: MiddlewareHandler,
	apiContext: APIContext,
	responseFunction: () => Promise<Response> | Response
): Promise<Response> {
	let nextCalled = false;
	let responseFunctionPromise: Promise<Response> | Response | undefined = undefined;

	const response = await onRequest(apiContext, async () => {
		nextCalled = true;
		responseFunctionPromise = responseFunction();
		return responseFunctionPromise;
	});

	if (response && response instanceof Response) {
		return response;
	}

	if (response === undefined) {
		/**
		 * This seems unintentional, but it might be breaking to backtrack.
		 * TODO: remove in next major release
		 * - Arsh
		 */
		if (nextCalled && responseFunctionPromise) {
			return responseFunctionPromise;
		}
		/**
		 * Here we handle the case where `next` was called and returned nothing.
		 *
		 * There might be cases where `next` isn't called and the middleware **must** return
		 * something.
		 */
		if (nextCalled) {
			throw new AstroError(AstroErrorData.MiddlewareNotAResponse);
		}
		throw new AstroError(AstroErrorData.MiddlewareNoDataOrNextCalled);
	}

	throw new AstroError(AstroErrorData.MiddlewareNotAResponse);
}
