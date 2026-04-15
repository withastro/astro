import { removeBase } from '@astrojs/internal-helpers/path';
import type { RouteData } from '../../types/public/internal.js';
import type { SSRManifest, RouteInfo } from '../../types/public/index.js';
import { getParams } from '../render/params-and-props.js';
import { computeRedirectStatus, redirectIsExternal, resolveRedirectTarget } from './render.js';

/**
 * Creates a handler function that checks whether a request matches any
 * configured redirect routes and, if so, returns the appropriate redirect
 * Response. Returns `undefined` when the request does not match any redirect.
 *
 * This is a pure function of (manifest) → (request) → Response | undefined,
 * making it easy to unit-test without a full Hono context.
 */
export function createRedirectsHandler(
	manifest: SSRManifest,
): (request: Request) => Response | undefined {
	const redirectRoutes: RouteData[] = manifest.routes
		.map((r: RouteInfo) => r.routeData)
		.filter((r: RouteData) => r.type === 'redirect');

	if (redirectRoutes.length === 0) {
		return () => undefined;
	}

	return (request: Request): Response | undefined => {
		const url = new URL(request.url);
		const rawPathname = removeBase(url.pathname, manifest.base);

		for (const routeData of redirectRoutes) {
			if (routeData.pattern.test(decodeURI(rawPathname))) {
				// Use the raw (encoded) pathname for params so the Location
				// header preserves the original URL encoding.
				const params = getParams(routeData, rawPathname);
				const status = computeRedirectStatus(
					request.method,
					routeData.redirect,
					routeData.redirectRoute,
				);
				const location = resolveRedirectTarget(
					params,
					routeData.redirect,
					routeData.redirectRoute,
					manifest.trailingSlash,
				);
				// Use Response.redirect() for external URLs so the Location
				// header is normalized per URL spec (e.g. trailing slash added).
				if (routeData.redirect && redirectIsExternal(routeData.redirect)) {
					const target =
						typeof routeData.redirect === 'string'
							? routeData.redirect
							: routeData.redirect.destination;
					return Response.redirect(target, status);
				}
				return new Response(null, { status, headers: { location } });
			}
		}

		return undefined;
	};
}
