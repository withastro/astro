/**
 * A framework-agnostic request handler. Takes a standard `Request` and
 * returns a `Response`. This mirrors the Web Fetch API handler shape, which
 * lets handlers compose easily with other middleware systems later.
 */
export type FetchHandler = (request: Request) => Promise<Response>;

/**
 * An object with a `fetch` method that handles incoming requests.
 * This is the shape expected by `src/app.ts` and aligns with the
 * convention used by Cloudflare Workers, Bun, and Hono.
 *
 * @example
 * ```ts
 * import type { Fetchable } from 'astro';
 *
 * export default {
 *   async fetch(request) {
 *     return new Response('ok');
 *   }
 * } satisfies Fetchable;
 * ```
 */
export interface Fetchable {
	fetch(request: Request): Response | Promise<Response>;
}
