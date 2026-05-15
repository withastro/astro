import { matchAllRoutes } from './match.js';
import { getSortedPreloadedMatches } from '../../prerender/routing.js';
import { getProps } from '../render/index.js';
import { getCustom404Route } from './helpers.js';
import { NoMatchingStaticPathFound } from '../errors/errors-data.js';
import { isAstroError } from '../errors/errors.js';
async function matchRoute(pathname, routesList, pipeline, manifest) {
	const { logger, routeCache } = pipeline;
	const matches = matchAllRoutes(pathname, routesList);
	const preloadedMatches = getSortedPreloadedMatches({
		matches,
		manifest,
	});
	for await (const { route: maybeRoute, filePath } of preloadedMatches) {
		try {
			await getProps({
				mod: await pipeline.getComponentByRoute(maybeRoute),
				routeData: maybeRoute,
				routeCache,
				pathname,
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
			if (isAstroError(e) && e.title === NoMatchingStaticPathFound.title) {
				continue;
			}
			throw e;
		}
	}
	const altPathname = pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
	if (altPathname !== pathname) {
		return await matchRoute(altPathname, routesList, pipeline, manifest);
	}
	if (matches.length) {
		const possibleRoutes = matches.flatMap((route) => route.component);
		logger.warn(
			'router',
			`${NoMatchingStaticPathFound.message(pathname)}

${NoMatchingStaticPathFound.hint(possibleRoutes)}`,
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
	return void 0;
}
export { matchRoute };
