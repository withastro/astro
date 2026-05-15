import type { ComponentInstance } from '../../types/astro.js';
import type { FetchState } from '../fetch/fetch-state.js';
import type { RewritePayload } from '../../types/public/common.js';
import type { RouteData } from '../../types/public/internal.js';
interface TryRewriteResult {
	routeData: RouteData;
	componentInstance: ComponentInstance;
	newUrl: URL;
	pathname: string;
}
/**
 * Validates and applies a rewrite target to the given `FetchState`.
 *
 * - Validates that SSR→prerender rewrites are not attempted (except
 *   for i18n fallback routes).
 * - Mutates `state` to reflect the new route: request, URL, cookies,
 *   params, pathname, component instance, etc.
 * - Invalidates cached API contexts so they're re-derived from the
 *   new route.
 *
 * Called by both `Rewrites.execute()` (user-triggered `Astro.rewrite`)
 * and `AstroMiddleware` (middleware `next(payload)`).
 */
export declare function applyRewriteToState(
	state: FetchState,
	payload: RewritePayload,
	{ routeData, componentInstance, newUrl, pathname }: TryRewriteResult,
	{
		mergeCookies,
	}?: {
		mergeCookies?: boolean;
	},
): void;
/**
 * Executes a user-triggered rewrite (`Astro.rewrite(...)` /
 * `ctx.rewrite(...)`) against a `FetchState`. Resolves the rewrite
 * target via `pipeline.tryRewrite`, validates it, mutates the
 * `FetchState` to reflect the new route, and re-runs the middleware
 * and page dispatch to produce the new response.
 */
export declare class Rewrites {
	execute(state: FetchState, payload: RewritePayload): Promise<Response>;
}
export {};
