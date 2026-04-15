/**
 * Any object with a `fetch` method that takes a Request and returns a Response.
 * This is the interface that user apps (Hono, custom handlers, etc.) must satisfy.
 */
export interface FetchHandler {
	fetch(request: Request): Response | Promise<Response>;
}
