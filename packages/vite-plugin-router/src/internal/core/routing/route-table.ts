import type { RouteData, SSRManifest } from '../../types/public/internal.js';
import { createManifestMemo } from '../manifest/memo.js';
import { ensure404Route } from './astro-designed-error-pages.js';
import { Router } from './router.js';

export interface RouteTable {
	/** Route data derived from the manifest, used for route matching. */
	routes: RouteData[];
	/** Pattern-matching router compiled from `routes`. */
	router: Router;
}

function compileRouteTable(manifest: SSRManifest, routes: RouteData[]): RouteTable {
	const routesList = ensure404Route({ routes });
	const router = new Router(routesList.routes, {
		base: manifest.base,
		trailingSlash: manifest.trailingSlash,
		buildFormat: manifest.buildFormat,
	});
	return { routes: routesList.routes, router };
}

const routeTables = createManifestMemo((manifest) =>
	// Fresh array: `ensure404Route` mutates the DERIVED list, never `manifest.routes`.
	compileRouteTable(
		manifest,
		(manifest.routes ?? []).map((route) => route.routeData),
	),
);

/**
 * The route table for a manifest: the derived route list (with the default
 * 404 ensured) and the compiled router. All route reads — matching, rewrites,
 * custom-404 fallbacks, `manifestData` accessors — go through this single
 * entry so dev HMR updates are visible to every consumer at once.
 */
export function getRouteTable(manifest: SSRManifest): RouteTable {
	return routeTables.get(manifest);
}

/**
 * Atomically replaces the route table for a manifest (dev `astro:routes-updated`).
 * Runs `ensure404Route` on the new list, compiles a fresh `Router`, and swaps
 * the memo entry in one step, so no consumer can observe a half-updated table.
 */
export function updateRouteTable(manifest: SSRManifest, routes: RouteData[]): void {
	// Copy so `ensure404Route` never mutates the caller's array.
	routeTables.set(manifest, compileRouteTable(manifest, [...routes]));
}

/**
 * Low-level route matching against the manifest routes. Returns the matched
 * `RouteData` or `undefined`. Does not filter prerendered routes or check
 * public assets — use the app-level match for that.
 */
export function matchRoute(manifest: SSRManifest, pathname: string): RouteData | undefined {
	const match = getRouteTable(manifest).router.match(pathname, { allowWithoutBase: true });
	if (match.type !== 'match') return undefined;
	return match.route;
}

/**
 * Returns all routes matching the given pathname, in priority order. Used when
 * the first match cannot serve the request (e.g. a prerendered dynamic route
 * that doesn't cover this specific path) and the caller needs to try
 * subsequent matches.
 */
export function matchAllRoutes(manifest: SSRManifest, pathname: string): RouteData[] {
	return getRouteTable(manifest).router.matchAll(pathname, { allowWithoutBase: true });
}
