/**
 * Use this module only to have functions needed in development
 */
import type { RoutesList } from '../../types/astro.js';
import type { SSRManifest } from '../app/types.js';
import { matchAllRoutes } from './match.js';
import { getSortedPreloadedMatches } from '../../prerender/routing.js';
import { getProps } from '../render/index.js';
import { getCustom404Route } from './helpers.js';
import { NoMatchingStaticPathFound } from '../errors/errors-data.js';
import { isAstroError } from '../errors/errors.js';
import type { RouteData } from '../../types/public/index.js';
import type { RunnablePipeline } from '../../vite-plugin-app/pipeline.js';

interface MatchedRoute {
	route: RouteData;
	filePath: URL;
	resolvedPathname: string;
}

export async function matchRoute(
	pathname: string,
	routesList: RoutesList,
	pipeline: RunnablePipeline,
	manifest: SSRManifest,
): Promise<MatchedRoute | undefined> {
	const { logger, routeCache } = pipeline;
	const matches = matchAllRoutes(pathname, routesList);

	const preloadedMatches = getSortedPreloadedMatches({
		pipeline,
		matches,
		manifest,
	});

	for await (const { route: maybeRoute, filePath } of preloadedMatches) {
		// attempt to get static paths
		// if this fails, we have a bad URL match!
		try {
			await getProps({
				mod: await pipeline.getComponentByRoute(maybeRoute),
				routeData: maybeRoute,
				routeCache,
				pathname: pathname,
				logger,
				serverLike: pipeline.manifest.serverLike,
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
			throw e;
		}
	}

	// Try without `.html` extensions or `index.html` in request URLs to mimic
	// routing behavior in production builds. This supports both file and directory
	// build formats, and is necessary based on how the manifest tracks build targets.
	const altPathname = pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');

	if (altPathname !== pathname) {
		return await matchRoute(altPathname, routesList, pipeline, manifest);
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

	const custom404 = getCustom404Route(routesList);

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
