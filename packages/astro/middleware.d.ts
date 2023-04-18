import type { APIContext, MiddlewareNext, MiddlewareResponseHandler } from './src/@types/astro';

/**
 * Utility function to join multiple middleware functions together
 */
export function sequence(...handlers: MiddlewareResponseHandler[]): MiddlewareResponseHandler;

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
export function defineMiddleware(fn: MiddlewareResponseHandler): MiddlewareResponseHandler;
