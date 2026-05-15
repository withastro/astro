import type { AstroLogger } from '../logger/core.js';
import type { AstroPrerenderer, RouteToHeaders } from '../../types/public/index.js';
import type { RouteData } from '../../types/public/internal.js';
import { type BuildInternals } from './internal.js';
import type { StaticBuildOptions } from './types.js';
export declare function generatePages(
	options: StaticBuildOptions,
	internals: BuildInternals,
	prerenderOutputDir: URL,
): Promise<void>;
/**
 * The result of rendering a single path, ready to be written to the filesystem.
 * `null` means no file should be written (empty body, redirect skipped, or a file with the
 * same output path already exists in `publicDir`).
 */
export interface RenderPathResult {
	body: string | Uint8Array;
	outFile: URL;
	outFolder: URL;
}
interface RenderToPathPayload {
	prerenderer: AstroPrerenderer;
	pathname: string;
	route: RouteData;
	options: StaticBuildOptions;
	routeToHeaders?: RouteToHeaders;
	logger: AstroLogger;
}
/**
 * Renders a single prerendered path to an in-memory result.
 *
 * This function is intentionally free of filesystem writes — it only calls
 * `prerenderer.render()` and computes output paths.  The caller is responsible
 * for persisting the returned `body` to disk (or any other destination).
 *
 * Returning `null` signals that no output file should be created for this path:
 * - the response body was empty
 * - the redirect was suppressed by `config.build.redirects`
 * - a file with the same output path already exists in `publicDir` (public files
 *   take priority over generated pages, so the generated page is skipped)
 *
 * @param params
 * @param params.prerenderer    - The prerenderer used to obtain a `Response` for the path.
 * @param params.pathname       - The URL pathname being rendered (e.g. `/about`).
 * @param params.route          - Route data for the page being rendered.
 * @param params.options        - Build options; `options.fsMod` is used to check whether a
 *                                file already exists in `publicDir` at the output path.
 * @param [params.routeToHeaders=new Map()] - Mutable map populated with response headers when
 *                                the adapter requests static-header tracking. Callers that do
 *                                not need to inspect the headers after the call can omit this.
 * @param params.logger         - Logger instance.
 */
export declare function renderPath({
	prerenderer,
	pathname,
	route,
	options,
	routeToHeaders,
	logger,
}: RenderToPathPayload): Promise<RenderPathResult | null>;
export {};
