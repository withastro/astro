import type { ComponentInstance } from '../../types/astro.js';
import type { RouteData } from '../../types/public/internal.js';
import type { SSRManifest } from '../app/types.js';
import { NoMatchingStaticPathFound } from '../errors/errors-data.js';
import { isAstroError } from '../errors/errors.js';
import { getLogger } from '../logger/manifest-logger.js';
import { getProps } from '../render/params-and-props.js';
import { getRouteCache } from '../render/route-cache.js';
import type { ValidateRouteForRewrite } from './rewrite.js';

/**
 * Builds the candidate check that `findRouteToRewrite` uses when a route's
 * `distURL` is unavailable, which is the case in `astro dev` and for on-demand
 * routes in a server build. It mirrors what `matchRoute` already does for an
 * ordinary request: ask the route whether `getStaticPaths()` actually produces
 * this pathname, and move on to the next candidate when it does not.
 */
export function createRewriteRouteValidator(
	manifest: SSRManifest,
	getComponentByRoute: (manifest: SSRManifest, route: RouteData) => Promise<ComponentInstance>,
): ValidateRouteForRewrite {
	return async (route, pathname) => {
		try {
			await getProps({
				mod: await getComponentByRoute(manifest, route),
				routeData: route,
				routeCache: getRouteCache(manifest),
				pathname,
				logger: getLogger(manifest),
				serverLike: manifest.serverLike,
				base: manifest.base,
				trailingSlash: manifest.trailingSlash,
			});
			return true;
		} catch (e) {
			// Only "this route does not own the path" rejects a candidate. A
			// genuine `getStaticPaths()` failure must keep surfacing to the user
			// rather than degrading into a silent 404.
			if (isAstroError(e) && e.title === NoMatchingStaticPathFound.title) {
				return false;
			}
			throw e;
		}
	};
}
