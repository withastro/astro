import type { ComponentInstance, GetStaticPathsItem, GetStaticPathsResult, GetStaticPathsResultKeyed, RouteCache, RouteData } from '../../@types/astro';
import type { LogOptions } from '../logger';

import { debug } from '../logger.js';
import { generatePaginateFunction } from '../ssr/paginate.js';

type RSSFn = (...args: any[]) => any;

export async function callGetStaticPaths(mod: ComponentInstance, route: RouteData, rssFn?: RSSFn): Promise<GetStaticPathsResultKeyed> {
	const staticPaths: GetStaticPathsResult = await (
		await mod.getStaticPaths!({
			paginate: generatePaginateFunction(route),
			rss:
				rssFn ||
				(() => {
					/* noop */
				}),
		})
	).flat();

	const keyedStaticPaths = staticPaths as GetStaticPathsResultKeyed;
	keyedStaticPaths.keyed = new Map<string, GetStaticPathsItem>();
	for (const sp of keyedStaticPaths) {
		const paramsKey = JSON.stringify(sp.params);
		keyedStaticPaths.keyed.set(paramsKey, sp);
	}

	return keyedStaticPaths;
}

export async function assignStaticPaths(routeCache: RouteCache, route: RouteData, mod: ComponentInstance, rssFn?: RSSFn): Promise<void> {
	const staticPaths = await callGetStaticPaths(mod, route, rssFn);
	routeCache[route.component] = staticPaths;
}

export async function ensureRouteCached(routeCache: RouteCache, route: RouteData, mod: ComponentInstance, rssFn?: RSSFn): Promise<GetStaticPathsResultKeyed> {
	if (!routeCache[route.component]) {
		const staticPaths = await callGetStaticPaths(mod, route, rssFn);
		routeCache[route.component] = staticPaths;
		return staticPaths;
	} else {
		return routeCache[route.component];
	}
}

export function findPathItemByKey(staticPaths: GetStaticPathsResultKeyed, paramsKey: string, logging: LogOptions) {
	let matchedStaticPath = staticPaths.keyed.get(paramsKey);
	if (matchedStaticPath) {
		return matchedStaticPath;
	}

	debug(logging, 'findPathItemByKey', `Unexpected cache miss looking for ${paramsKey}`);
	matchedStaticPath = staticPaths.find(({ params: _params }) => JSON.stringify(_params) === paramsKey);
}
