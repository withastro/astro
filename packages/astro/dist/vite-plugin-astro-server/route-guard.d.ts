import type * as vite from 'vite';
import type { AstroSettings } from '../types/astro.js';
/**
 * Outcome of the route guard evaluation for a dev-server request.
 *
 * - **`next`** — Allow the request through to downstream middleware.
 * - **`block`** — The file exists at the project root but outside srcDir/publicDir.
 *   Respond with a 404.
 */
export type RouteGuardDecision =
	| {
			action: 'next';
	  }
	| {
			action: 'block';
			pathname: string;
	  };
/**
 * Filesystem query results needed by the route guard decision function.
 * Callers resolve these from the real filesystem; tests can provide them directly.
 */
export interface RouteGuardFsInfo {
	/** Whether the resolved pathname exists inside the project's `publicDir` (e.g. `public/robots.txt`). */
	existsInPublic: boolean;
	/** Whether the resolved pathname exists inside the project's `srcDir` (e.g. `src/pages/index.astro`). */
	existsInSrc: boolean;
	/** Whether the resolved pathname exists at the project root as a **file** (not a directory). Directories are allowed through because they may share names with valid page routes. */
	existsAtRootAsFile: boolean;
}
/**
 * Pure decision function for the route guard middleware.
 *
 * Determines whether a request should be blocked (file exists at project root
 * but outside srcDir/publicDir) or allowed through. The filesystem lookups are
 * injected via `fsInfo` so this function remains pure and unit-testable.
 */
export declare function evaluateRouteGuard(
	url: string,
	acceptHeader: string,
	fsInfo: RouteGuardFsInfo,
): RouteGuardDecision;
/**
 * Middleware that prevents Vite from serving files that exist outside
 * of srcDir and publicDir when accessed via direct URL navigation.
 *
 * This fixes the issue where files like /README.md are served
 * when they exist at the project root but aren't part of Astro's routing.
 */
export declare function routeGuardMiddleware(
	settings: AstroSettings,
): vite.Connect.NextHandleFunction;
