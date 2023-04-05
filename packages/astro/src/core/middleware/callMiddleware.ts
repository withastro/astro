import type { APIContext, MiddlewareHandler, MiddlewareResolve } from '../../@types/astro';
import { renderPage as coreRenderPage } from '../render';

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

	let resolveCalledResolve: any;
	let resolveCalled = new Promise((resolve) => {
		resolveCalledResolve = resolve;
	});
	const resolve: MiddlewareResolve<R> = () => {
		const response = responseFunction();
		resolveCalledResolve('resolveCalled');
		return response;
	};

	let middlewarePromise = onRequest(apiContext, resolve);

	return await Promise.race([middlewarePromise, resolveCalled]).then(async (value) => {
		if (value === 'resolveCalled') {
			// Middleware called resolve()
			// render the page and then pass back to middleware
			// for post-processing
			const responseResult = await responseFunction();
			await resolveResolve(responseResult);
			return middlewarePromise;
		} else {
			// Middleware did not call resolve()
			return await responseFunction();
		}
	});
}
