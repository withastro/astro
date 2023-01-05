import type { ManifestData, RouteData } from '../../@types/astro';

/** Find matching route from pathname */
export function matchRoute(pathname: string, manifest: ManifestData): RouteData | undefined {
	return manifest.routes.find((route) => route.pattern.test(pathname));
}

/** Find matching static asset from pathname */
export function matchAssets(route: RouteData, assets: Set<string>): string | undefined {
	for (const asset of assets) {
		if (!asset.endsWith('.html')) continue;
		if (route.pattern.test(asset)) {
			return asset;
		}
		if (route.pattern.test(asset.replace(/index\.html$/, ''))) {
			return asset;
		}
	}
}

/** Finds all matching routes from pathname */
export function matchAllRoutes(pathname: string, manifest: ManifestData): RouteData[] {
	return manifest.routes.filter((route) => route.pattern.test(pathname));
}
