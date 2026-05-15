import type { FetchState } from '../fetch/fetch-state.js';
import type { APIContext } from '../../types/public/context.js';
import { type Pipeline } from '../base-pipeline.js';
/**
 * Callback invoked at the bottom of the middleware chain to dispatch the
 * request to the matched route (endpoint / redirect / page / fallback).
 *
 * Callers of `AstroMiddleware.handle` pass their owned `PagesHandler`'s
 * `handle` method (bound) so route dispatch logic stays out of the
 * middleware layer.
 */
export type RenderRouteCallback = (state: FetchState, ctx: APIContext) => Promise<Response>;
/**
 * Handles the execution of Astro's middleware chain (internal + user) for a
 * single render. Holds a reference to the `Pipeline` and composes the
 * internal and user middleware at render time.
 *
 * Reads per-request data (componentInstance, slots, props, API contexts)
 * off the supplied `FetchState`. The actual route dispatch (endpoint /
 * redirect / page / fallback) is supplied by the caller as
 * `renderRouteCallback` — typically bound to a `PagesHandler.handle`.
 */
export declare class AstroMiddleware {
	#private;
	constructor(pipeline: Pipeline);
	handle(state: FetchState, renderRouteCallback: RenderRouteCallback): Promise<Response>;
}
