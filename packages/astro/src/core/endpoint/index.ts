import type { EndpointHandler } from '../../types/public/common.js';

/**
 * A utility function to define an endpoint handler with full type inference.
 *
 * @example
 * ```ts
 * import { defineEndpoint } from "astro:endpoint";
 *
 * export const GET = defineEndpoint(async (context) => {
 *   return Response.json({ message: "Hello!" });
 * });
 * ```
 */
export function defineEndpoint(fn: EndpointHandler): EndpointHandler {
	return fn;
}