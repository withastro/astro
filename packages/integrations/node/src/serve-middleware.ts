import type { MiddlewareHandler, RouteData } from 'astro';
import type { NodeApp } from 'astro/app/node';
import { requestAls } from './standalone.js';

/**
 * Execute middleware for a static/prerendered request.
 * Returns whether the middleware handled the response.
 */
export async function executeMiddlewareForStatic(
	request: Request,
	routeData: RouteData | undefined,
	middleware: MiddlewareHandler,
	app: NodeApp,
	locals?: object,
): Promise<{ handled: boolean; response: Response | null }> {
	try {
		const result = await requestAls.run(request.url, async () => {
			return await app.executeMiddlewareOnly(request, routeData, middleware, locals);
		});

		return result;
	} catch (err) {
		// Re-throw the error to be handled by the caller
		throw err instanceof Error ? err : new Error(String(err));
	}
}

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
	// Skip middleware for asset files
	if (
		urlPath.startsWith('/_astro/') ||
		/\.(?:css|js|json|xml|txt|ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|webp|avif|map)$/i.test(
			urlPath,
		)
	) {
		return false;
	}

	// Middleware should run for HTML pages (anything else)
	return true;
}

/**
 * Determine if middleware should be executed for this request.
 */
export function shouldRunMiddleware(
	urlPath: string | undefined,
	_routeData: RouteData | undefined,
	runMiddlewareOnRequest: boolean,
): boolean {
	if (!urlPath || !runMiddlewareOnRequest) {
		return false;
	}

	// Only run middleware for prerendered HTML pages
	if (!isPrerenderedHTMLPage(urlPath)) {
		return false;
	}

	// Optionally, we could check if routeData exists and is prerendered
	// For now, we rely on the HTML page check
	return true;
}
