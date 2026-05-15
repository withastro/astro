import type { MiddlewareHandler, RewritePayload } from '../../types/public/common.js';
import type { APIContext } from '../../types/public/context.js';
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
 * response. A middleware cannot call `next` and return a new `Response` from scratch (maybe with a redirect).
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
export declare function callMiddleware(
	onRequest: MiddlewareHandler,
	apiContext: APIContext,
	responseFunction: (
		apiContext: APIContext,
		rewritePayload?: RewritePayload,
	) => Promise<Response> | Response,
): Promise<Response>;
