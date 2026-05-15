import type { Params } from '../../types/public/common.js';
import type { RedirectConfig } from '../../types/public/index.js';
import type { RouteData } from '../../types/public/internal.js';
import type { FetchState } from '../fetch/fetch-state.js';
export declare function redirectIsExternal(redirect: RedirectConfig): boolean;
/**
 * Computes the HTTP status code for a redirect response.
 *
 * - If the route has a `redirectRoute` and an explicit numeric status, that status is used.
 * - Otherwise: GET → 301, non-GET (e.g. POST) → 308.
 */
export declare function computeRedirectStatus(
	method: string,
	redirect: RedirectConfig | undefined,
	redirectRoute: RouteData | undefined,
): number;
/**
 * Resolves the final redirect target URL by substituting dynamic params into
 * the redirect string (e.g. `/[slug]/page` → `/hello/page`).
 *
 * When `redirectRoute` is provided its route generator is used; otherwise params
 * are substituted manually into the string redirect target.
 */
export declare function resolveRedirectTarget(
	params: Params,
	redirect: RedirectConfig | undefined,
	redirectRoute: RouteData | undefined,
	trailingSlash: 'always' | 'never' | 'ignore',
): string;
export declare function renderRedirect(state: FetchState): Promise<Response>;
