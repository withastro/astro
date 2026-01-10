import type { RouteData } from 'astro';

/**
 * Check if a URL path is for a prerendered HTML page (not an asset).
 * Middleware should only run for HTML pages, not static assets.
 *
 * Static assets are identified by:
 * - Paths starting with `/_astro/` (Astro's built assets directory)
 * - Files with common asset extensions: css, js, json, xml, txt, ico, png, jpg, jpeg,
 *   gif, svg, woff, woff2, ttf, eot, webp, avif, map
 *
 * All other paths are considered HTML pages and will have middleware executed.
 */
function isPrerenderedHTMLPage(urlPath: string): boolean {
	// Middleware should run for HTML pages, not asset files
	return !urlPath.startsWith('/_astro/') && !/\.(?:css|js|json|xml|txt|ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|webp|avif|map)$/i.test(urlPath);
}

/**
 * Determine if middleware should be executed for this request.
 * Only runs when the adapter has opted in via runMiddlewareOnRequest option.
 */
export function shouldRunMiddleware(
	urlPath: string | undefined,
	_routeData: RouteData | undefined,
	runMiddlewareOnRequest: boolean,
): boolean {
	// Only run middleware for prerendered HTML pages when enabled
	return !!(urlPath && runMiddlewareOnRequest && isPrerenderedHTMLPage(urlPath));
}
