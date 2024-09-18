import type { ManifestData } from '../../types/astro.js';
import type { RouteData } from '../../types/public/internal.js';

// NOTE: Route matching should work regardless of trailingSlash option as it's called
// before trailingSlash is enforced or determined, as trailingSlash depends on the route
// type: page or endpoint.

/** Find matching route from pathname */
export function matchRoute(pathname: string, manifest: ManifestData): RouteData | undefined {
	const decodedPathname = decodeURI(pathname);
	return manifest.routes.find((route) => {
		return (
			route.pattern.test(decodedPathname) ||
			route.fallbackRoutes.some((fallbackRoute) => fallbackRoute.pattern.test(decodedPathname))
		);
	});
}

/** Finds all matching routes from pathname */
export function matchAllRoutes(pathname: string, manifest: ManifestData): RouteData[] {
	return manifest.routes.filter((route) => route.pattern.test(decodeURI(pathname)));
}
