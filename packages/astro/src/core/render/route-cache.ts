import type {
	ComponentInstance,
	GetStaticPathsItem,
	GetStaticPathsResult,
	GetStaticPathsResultKeyed,
	Params,
	RouteData,
	RuntimeMode,
} from '../../@types/astro';
import { AstroError, AstroErrorData } from '../errors/index.js';
import type { Logger } from '../logger/core.js';

import { stringifyParams } from '../routing/params.js';
import { validateDynamicRouteModule, validateGetStaticPathsResult } from '../routing/validation.js';
import { generatePaginateFunction } from './paginate.js';

interface CallGetStaticPathsOptions {
	mod: ComponentInstance;
	route: RouteData;
	routeCache: RouteCache;
	logger: Logger;
	ssr: boolean;
}

export async function callGetStaticPaths({
	mod,
	route,
	routeCache,
	logger,
	ssr,
}: CallGetStaticPathsOptions): Promise<GetStaticPathsResultKeyed> {
	const cached = routeCache.get(route);
	if (cached?.staticPaths) return cached.staticPaths;

	validateDynamicRouteModule(mod, { ssr, route });

	// No static paths in SSR mode. Return an empty RouteCacheEntry.
	if (ssr && !route.prerender) {
		const entry: GetStaticPathsResultKeyed = Object.assign([], { keyed: new Map() });
		routeCache.set(route, { ...cached, staticPaths: entry });
		return entry;
	}

	// Add a check here to make TypeScript happy.
	// This is already checked in validateDynamicRouteModule().
	if (!mod.getStaticPaths) {
		throw new Error('Unexpected Error.');
	}

	// Calculate your static paths.
	let staticPaths: GetStaticPathsResult = [];
	staticPaths = await mod.getStaticPaths({
		paginate: generatePaginateFunction(route),
		rss() {
			throw new AstroError(AstroErrorData.GetStaticPathsRemovedRSSHelper);
		},
	});

	validateGetStaticPathsResult(staticPaths, logger, route);

	const keyedStaticPaths = staticPaths as GetStaticPathsResultKeyed;
	keyedStaticPaths.keyed = new Map<string, GetStaticPathsItem>();

	for (const sp of keyedStaticPaths) {
		const paramsKey = stringifyParams(sp.params, route);
		keyedStaticPaths.keyed.set(paramsKey, sp);
	}

	routeCache.set(route, { ...cached, staticPaths: keyedStaticPaths });
	return keyedStaticPaths;
}

interface RouteCacheEntry {
	staticPaths: GetStaticPathsResultKeyed;
}

/**
 * Manage the route cache, responsible for caching data related to each route,
 * including the result of calling getStaticPath() so that it can be reused across
 * responses during dev and only ever called once during build.
 */
export class RouteCache {
	private logger: Logger;
	private cache: Record<string, RouteCacheEntry> = {};
	private mode: RuntimeMode;

	constructor(logger: Logger, mode: RuntimeMode = 'production') {
		this.logger = logger;
		this.mode = mode;
	}

	/** Clear the cache. */
	clearAll() {
		this.cache = {};
	}

	set(route: RouteData, entry: RouteCacheEntry): void {
		// NOTE: This shouldn't be called on an already-cached component.
		// Warn here so that an unexpected double-call of getStaticPaths()
		// isn't invisible and developer can track down the issue.
		if (this.mode === 'production' && this.cache[route.component]?.staticPaths) {
			this.logger.warn(
				'routeCache',
				`Internal Warning: route cache overwritten. (${route.component})`
			);
		}
		this.cache[route.component] = entry;
	}

	get(route: RouteData): RouteCacheEntry | undefined {
		return this.cache[route.component];
	}
}

export function findPathItemByKey(
	staticPaths: GetStaticPathsResultKeyed,
	params: Params,
	route: RouteData,
	logger: Logger
) {
	const paramsKey = stringifyParams(params, route);
	const matchedStaticPath = staticPaths.keyed.get(paramsKey);
	if (matchedStaticPath) {
		return matchedStaticPath;
	}
	logger.debug('findPathItemByKey', `Unexpected cache miss looking for ${paramsKey}`);
}
