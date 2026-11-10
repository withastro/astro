import type { SSRManifest } from '../app/types.js';
import type { AstroLogger } from '../logger/core.js';

/**
 * Returns the pathname the first `extendRouting()` module resolves for a request, or `undefined`
 * when none changes it.
 *
 * @param pathname The pathname the request would be matched with, when already computed.
 */
export function resolveRoutingPathname(
	manifest: SSRManifest,
	request: Request,
	url: URL,
	logger: AstroLogger,
	pathname?: string,
): string | undefined {
	for (const extension of manifest.routing ?? []) {
		const resolved = extension.resolvePathname?.({ manifest, request, url, pathname, logger });
		if (resolved !== undefined) return resolved;
	}
	return undefined;
}

/**
 * Returns the route of the error page for `pathname`: the first existing route an
 * `extendRouting()` module proposes (for example `/es/404`), otherwise `/404` or `/500`.
 */
export function getErrorRoutePath(
	manifest: SSRManifest,
	pathname: string,
	status: 404 | 500,
	routes: Pick<SSRManifest['routes'][number]['routeData'], 'route'>[],
	appendTrailingSlash = false,
): string {
	const suffix = appendTrailingSlash ? '/' : '';
	for (const extension of manifest.routing ?? []) {
		const route = extension.getErrorRoute?.({ manifest, pathname, status });
		if (route !== undefined && routes.some((r) => r.route === route)) {
			return `${route}${suffix}`;
		}
	}
	return `/${status}${suffix}`;
}

/** Whether an `extendRouting()` module declares `route` an error page for `status`. */
export function isExtensionErrorRoute(
	manifest: SSRManifest,
	route: string,
	status: 404 | 500,
): boolean {
	return (manifest.routing ?? []).some((extension) =>
		extension.isErrorRoute?.({ manifest, route, status }),
	);
}
