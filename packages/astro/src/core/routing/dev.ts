/**
 * Use this module only to have functions needed in development
 */
import type { SSRManifest } from '../app/types.js';
import { matchAllRoutes } from './match.js';
import { getSortedPreloadedMatches } from '../../prerender/routing.js';
import { getProps } from '../render/index.js';
import { getCustom404Route } from './helpers.js';
import { NoMatchingStaticPathFound } from '../errors/errors-data.js';
import { isAstroError } from '../errors/errors.js';
import type { RouteData } from '../../types/public/index.js';
import { getEnvironment } from '../environment/index.js';
import { getLogger } from '../logger/manifest-logger.js';
import { getRouteCache } from '../render/route-cache.js';
import { getRouteTable } from './route-table.js';
import { getErrorRoutePath } from '../../i18n/error-routes.js';

interface MatchedRoute {
	route: RouteData;
	filePath: URL;
	resolvedPathname: string;
}

export async function matchRoute(
	manifest: SSRManifest,
	pathname: string,
	{ prerenderOnly }: { prerenderOnly?: boolean } = {},
): Promise<MatchedRoute | undefined> {
	const logger = getLogger(manifest);
	const routeCache = getRouteCache(manifest);
	const env = getEnvironment(manifest);
	// The single fresh route table: matching, the custom-404 fallback,
	// and every other consumer read the same atomically-swapped list.
	const routesList = getRouteTable(manifest);
	const matches = matchAllRoutes(pathname, routesList);

	const preloadedMatches = getSortedPreloadedMatches({
		matches,
		manifest,
	});

	let firstError: unknown = null;
	let skippedPrerenderOnly = false;
	for await (const { route: maybeRoute, filePath } of preloadedMatches) {
		// When running as the prerender handler, skip non-prerendered routes
		// before importing their components. Their modules may use runtime-
		// specific APIs (e.g. cloudflare:workers) unavailable in the prerender
		// environment.
		if (prerenderOnly && !maybeRoute.prerender) {
			skippedPrerenderOnly = true;
			continue;
		}
		// attempt to get static paths
		// if this fails, we have a bad URL match!
		try {
			await getProps({
				mod: await env.getComponentByRoute(manifest, maybeRoute),
				routeData: maybeRoute,
				routeCache,
				pathname: pathname,
				logger,
				serverLike: manifest.serverLike,
				base: manifest.base,
				trailingSlash: manifest.trailingSlash,
			});
			return {
				route: maybeRoute,
				filePath,
				resolvedPathname: pathname,
			};
		} catch (e) {
			// Ignore error for no matching static paths
			if (isAstroError(e) && e.title === NoMatchingStaticPathFound.title) {
				continue;
			}
			// Store the first error but keep trying other candidate routes.
			// A user error in one route's getStaticPaths() should not prevent
			// other matching routes from being attempted.
			firstError ??= e;
			continue;
		}
	}

	// If we exhausted all candidates and one threw a non-routing error,
	// re-throw it so the dev server can surface it.
	if (firstError) {
		throw firstError;
	}

	// Try without `.html` extensions or `index.html` in request URLs to mimic
	// routing behavior in production builds. This supports both file and directory
	// build formats, and is necessary based on how the manifest tracks build targets.
	const altPathname = pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');

	if (altPathname !== pathname) {
		return await matchRoute(manifest, altPathname, { prerenderOnly });
	}

	// A non-prerendered route matched but was skipped above. Don't warn or fall
	// back to the 404 route (which may be prerendered and would shadow the SSR
	// route): returning undefined lets the caller mark the request as not
	// handled, so it falls through to the SSR handler and its own full matching.
	if (skippedPrerenderOnly) {
		return undefined;
	}

	if (matches.length) {
		const possibleRoutes = matches.flatMap((route) => route.component);

		logger.warn(
			'router',
			`${NoMatchingStaticPathFound.message(
				pathname,
			)}\n\n${NoMatchingStaticPathFound.hint(possibleRoutes)}`,
		);
	}

	const errorRoutePath = getErrorRoutePath(
		pathname,
		404,
		routesList.routes,
		manifest.i18n?.locales,
		manifest.trailingSlash === 'always',
	);
	const custom404 =
		routesList.routes.find((route) => route.route === errorRoutePath) ??
		getCustom404Route(routesList);

	if (custom404) {
		const filePath = new URL(`./${custom404.component}`, manifest.rootDir);

		return {
			route: custom404,
			filePath,
			resolvedPathname: pathname,
		};
	}

	return undefined;
}
