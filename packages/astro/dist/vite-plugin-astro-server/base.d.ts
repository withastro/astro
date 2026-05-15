import type * as vite from 'vite';
import type { AstroLogger } from '../core/logger/core.js';
import type { AstroSettings } from '../types/astro.js';
/**
 * Outcome of the base-URL evaluation for a dev-server request.
 *
 * - **`rewrite`** — The request URL starts with the configured `base` path.
 *   Strip the base prefix so downstream handlers see a root-relative URL
 *   (e.g. `/docs/about` → `/about` when `base: '/docs'`).
 * - **`not-found-subpath`** — The user navigated to `/` or `/index.html` but
 *   the project has a non-root `base`. Respond with a 404 explaining that the
 *   site lives under the base path, so the developer knows to update the URL.
 * - **`not-found`** — The URL doesn't start with the base and the browser
 *   expects HTML (`Accept: text/html`). Respond with a generic 404 page.
 * - **`check-public`** — The URL doesn't match the base and the browser is
 *   requesting a non-HTML asset (image, script, font, etc.). The middleware
 *   must do an async `fs.stat` to decide whether the file exists in
 *   `publicDir` (and show a helpful base-path hint) or just pass through.
 *   This variant cannot be resolved purely.
 */
export type BaseRewriteDecision =
	| {
			action: 'rewrite';
			newUrl: string;
	  }
	| {
			action: 'not-found-subpath';
			pathname: string;
			devRoot: string;
	  }
	| {
			action: 'not-found';
			pathname: string;
	  }
	| {
			action: 'check-public';
	  };
/**
 * Computes the `devRoot` path used to match and strip the base prefix.
 *
 * The `devRoot` is the pathname portion of the base URL (resolved against the
 * `site` if present, otherwise against `http://localhost`). For example:
 * - `base: '/docs'`, no site → `/docs`
 * - `base: '/docs'`, `site: 'https://example.com'` → `/docs`
 * - `base: '/'` → `/`
 */
export declare function resolveDevRoot(
	base: string,
	site?: string,
): {
	devRoot: string;
	devRootReplacement: string;
};
/**
 * Pure decision function for base-URL dev-server rewriting.
 *
 * Evaluates whether the incoming `url` starts with the project's `base` path
 * and returns the action the middleware should take. The async `fs.stat` branch
 * (checking `publicDir`) is represented as `check-public` and must be handled
 * by the caller.
 */
export declare function evaluateBaseRewrite(
	url: string,
	pathname: string,
	acceptHeader: string | undefined,
	devRoot: string,
	devRootReplacement: string,
): BaseRewriteDecision;
export declare function baseMiddleware(
	settings: AstroSettings,
	logger: AstroLogger,
): vite.Connect.NextHandleFunction;
