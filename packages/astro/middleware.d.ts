import type { APIContext, MiddlewareNext } from './src/@types/astro';

type MiddlewareResponseHandler = import('./dist/@types/astro.js').MiddlewareResponseHandler;

/**
 * Utility function to join multiple middleware functions together
 */
export declare function sequence(
	...handlers: MiddlewareResponseHandler[]
): MiddlewareResponseHandler;

/**
 * Utility function to quickly type a middleware
 *
 * ## Example
 *
 * ```ts
 * import {defineMiddleware} from "astro/middleware"
 *
 * const onRequest = defineMiddleware(async (context, next) => {
 *
 *   return await next();
 * })
 * ```
 */
export declare function defineMiddleware(
	fn: (context: APIContext, next: MiddlewareNext<Response>) => Promise<Response | void>
): (context: APIContext, next: MiddlewareNext<Response>) => Promise<Response | void>;
