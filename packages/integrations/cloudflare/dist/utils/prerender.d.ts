/**
 * Prerender utilities for Cloudflare adapter
 *
 * During the build process, Astro prerenders pages by making requests to internal endpoints
 * served by the Cloudflare worker running in workerd. These endpoints are:
 *
 * - `/__astro_static_paths`: Returns all static paths that need to be prerendered.
 *   The prerenderer calls this to discover which routes/pages need to be generated.
 *
 * - `/__astro_prerender`: Renders a specific page given its URL and route data.
 *   The prerenderer calls this for each path to generate the static HTML.
 *
 * These endpoints are only active during the prerender build phase and are not
 * available in production or development.
 */
import type { BaseApp } from 'astro/app';
/**
 * Checks if the request is for the static paths prerender endpoint.
 * This endpoint returns all paths that need to be prerendered.
 */
export declare function isStaticPathsRequest(request: Request): boolean;
/**
 * Checks if the request is for the prerender endpoint.
 * This endpoint renders a specific page during the prerender phase.
 */
export declare function isPrerenderRequest(request: Request): boolean;
/**
 * Handles the static paths request, returning all paths that need prerendering.
 */
export declare function handleStaticPathsRequest(app: BaseApp): Promise<Response>;
/**
 * Handles a prerender request, rendering the specified page.
 */
export declare function handlePrerenderRequest(app: BaseApp, request: Request): Promise<Response>;
export declare function isStaticImagesRequest(request: Request): boolean;
/** Serializes the global staticImages map collected in workerd back to the Node-side build. */
export declare function handleStaticImagesRequest(): Response;
