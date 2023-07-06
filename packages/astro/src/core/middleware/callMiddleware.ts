import { bold } from 'kleur/colors';
import type {
	APIContext,
	EndpointOutput,
	MiddlewareHandler,
	MiddlewareNext,
} from '../../@types/astro';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { warn } from '../logger/core.js';
import type { Environment } from '../render';

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
export async function callMiddleware<R>(
	logging: Environment['logging'],
	onRequest: MiddlewareHandler<R>,
	apiContext: APIContext,
	responseFunction: () => Promise<R>
): Promise<Response | R> {
	let nextCalled = false;
	let responseFunctionPromise: Promise<R> | undefined = undefined;
	const next: MiddlewareNext<R> = async () => {
		nextCalled = true;
		responseFunctionPromise = responseFunction();
		return responseFunctionPromise;
	};

	let middlewarePromise = onRequest(apiContext, next);

	return await Promise.resolve(middlewarePromise).then(async (value) => {
		if (isEndpointOutput(value)) {
			warn(
				logging,
				'middleware',
				'Using simple endpoints can cause unexpected issues in the chain of middleware functions.' +
					`\nIt's strongly suggested to use full ${bold('Response')} objects.`
			);
		}

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
				if (value instanceof Response === false) {
					throw new AstroError(AstroErrorData.MiddlewareNotAResponse);
				}
				return value as R;
			} else {
				/**
				 * Here we handle the case where `next` was called and returned nothing.
				 */
				if (responseFunctionPromise) {
					return responseFunctionPromise;
				} else {
					throw new AstroError(AstroErrorData.MiddlewareNotAResponse);
				}
			}
		} else if (typeof value === 'undefined') {
			/**
			 * There might be cases where `next` isn't called and the middleware **must** return
			 * something.
			 *
			 * If not thing is returned, then we raise an Astro error.
			 */
			throw new AstroError(AstroErrorData.MiddlewareNoDataOrNextCalled);
		} else if (value instanceof Response === false) {
			throw new AstroError(AstroErrorData.MiddlewareNotAResponse);
		} else {
			// Middleware did not call resolve and returned a value
			return value as R;
		}
	});
}

function isEndpointOutput(endpointResult: any): endpointResult is EndpointOutput {
	return (
		!(endpointResult instanceof Response) &&
		typeof endpointResult === 'object' &&
		typeof endpointResult.body === 'string'
	);
}
