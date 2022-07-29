import type { ManifestData, RouteData } from '../../@types/astro';

/** Find matching route from pathname */
export function matchRoute(pathname: string, manifest: ManifestData): RouteData | undefined {
	return manifest.routes.find((route) => route.pattern.test(pathname));
}

/** Finds all matching routes from pathname */
export function matchAllRoutes(pathname: string, manifest: ManifestData): RouteData[] {
	return manifest.routes.filter((route) => route.pattern.test(pathname));
}
