import type { ManifestData, RouteData } from '../../@types/astro.js';

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
