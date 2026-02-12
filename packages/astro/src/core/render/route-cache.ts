import { invariant } from '../util/invariant.js';
import type { ComponentInstance } from '../../types/astro.js';
import type {
	GetStaticPathsItem,
	GetStaticPathsResult,
	GetStaticPathsResultKeyed,
	PaginateFunction,
	Params,
} from '../../types/public/common.js';
import type { AstroConfig, RuntimeMode } from '../../types/public/config.js';
import type { RouteData } from '../../types/public/internal.js';
import type { Logger } from '../logger/core.js';

import { stringifyParams } from '../routing/params.js';
import { validateDynamicRouteModule, validateGetStaticPathsResult } from '../routing/validation.js';
import { generatePaginateFunction } from './paginate.js';

interface CallGetStaticPathsOptions {
	mod: ComponentInstance | undefined;
	route: RouteData;
	routeCache: RouteCache;
	ssr: boolean;
	base: AstroConfig['base'];
	trailingSlash: AstroConfig['trailingSlash'];
}

export async function callGetStaticPaths({
	mod,
	route,
	routeCache,
	ssr,
	base,
	trailingSlash,
}: CallGetStaticPathsOptions): Promise<GetStaticPathsResultKeyed> {
	const cached = routeCache.get(route);
	if (!mod) {
		throw new Error('This is an error caused by Astro and not your code. Please file an issue.');
	}
	if (cached?.staticPaths) {
		return cached.staticPaths;
	}

	validateDynamicRouteModule(mod, { ssr, route });

	// No static paths in SSR mode. Return an empty RouteCacheEntry.
	if (ssr && !route.prerender) {
		const entry: GetStaticPathsResultKeyed = Object.assign([], { keyed: new Map() });
		routeCache.set(route, { ...cached, staticPaths: entry });
		return entry;
	}

	let staticPaths: GetStaticPathsResult = [];
	// Add a check here to make TypeScript happy.
	// This is already checked in validateDynamicRouteModule().
	if (!mod.getStaticPaths) {
		throw new Error('Unexpected Error.');
	}

	// Calculate your static paths.
	staticPaths = await mod.getStaticPaths({
		// Q: Why the cast?
		// A: So users downstream can have nicer typings, we have to make some sacrifice in our internal typings, which necessitate a cast here
		paginate: generatePaginateFunction(route, base, trailingSlash) as PaginateFunction,
		routePattern: route.route,
	});

	validateGetStaticPathsResult(staticPaths, route);

	const keyedStaticPaths = staticPaths as GetStaticPathsResultKeyed;
	keyedStaticPaths.keyed = new Map<string, GetStaticPathsItem>();

	for (const sp of keyedStaticPaths) {
		const paramsKey = stringifyParams(sp.params, route, trailingSlash);
		keyedStaticPaths.keyed.set(paramsKey, sp);
	}

	routeCache.set(route, { ...cached, staticPaths: keyedStaticPaths });
	return keyedStaticPaths;
}

interface RouteCacheEntry {
	staticPaths: GetStaticPathsResultKeyed;
	route?: Pick<RouteData, 'route' | 'component'>;
}

/**
 * Manage the route cache, responsible for caching data related to each route,
 * including the result of calling getStaticPath() so that it can be reused across
 * responses during dev and only ever called once during build.
 */
export class RouteCache {
	private logger: Logger;
	private cache: Record<string, RouteCacheEntry> = {};
	private runtimeMode: RuntimeMode;
	private sealed = false;

	constructor(logger: Logger, runtimeMode: RuntimeMode = 'production') {
		this.logger = logger;
		this.runtimeMode = runtimeMode;
	}

	/** Clear the cache. */
	clearAll() {
		this.cache = {};
	}

	seal() {
		this.sealed = true;
	}

	set(route: RouteData, entry: RouteCacheEntry): void {
		if (this.sealed) {
			throw new Error(
				`Route cache is sealed and cannot be updated. This indicates that getStaticPaths() was called during rendering for ${route.component}.`,
			);
		}
		const key = this.key(route);
		// NOTE: This shouldn't be called on an already-cached component.
		// Warn here so that an unexpected double-call of getStaticPaths()
		// isn't invisible and developer can track down the issue.
		if (this.runtimeMode === 'production' && this.cache[key]?.staticPaths) {
			this.logger.warn(null, `Internal Warning: route cache overwritten. (${key})`);
		}
		this.cache[key] = {
			...entry,
			route: {
				route: route.route,
				component: route.component,
			},
		};
	}

	get(route: RouteData): RouteCacheEntry | undefined {
		return this.cache[this.key(route)];
	}

	key(route: Pick<RouteData, 'route' | 'component'>) {
		return getRouteCacheKey(route);
	}

	getEntries() {
		return Object.entries(this.cache).map(([key, entry]) => ({ key, entry }));
	}
}

export interface SerializedRouteCacheEntry {
	key: string;
	route: Pick<RouteData, 'route' | 'component'>;
	staticPaths: GetStaticPathsResult;
	keyed: Array<[string, GetStaticPathsItem]>;
}

export interface SerializedRouteCache {
	entries: SerializedRouteCacheEntry[];
}

export function getRouteCacheKey(route: Pick<RouteData, 'route' | 'component'>): string {
	return `${route.route}_${route.component}`;
}

export function serializeRouteCache(routeCache: RouteCache): SerializedRouteCache {
	const entries = routeCache.getEntries().map(({ key, entry }) => {
		invariant(entry.route, `Route cache entry missing route data for ${key}`);
		return {
			key,
			route: entry.route,
			staticPaths: Array.from(entry.staticPaths),
			keyed: Array.from(entry.staticPaths.keyed.entries()),
		};
	});
	return { entries };
}

export function hydrateRouteCache(routeCache: RouteCache, serialized: SerializedRouteCache) {
	routeCache.clearAll();
	for (const entry of serialized.entries) {
		const keyed = new Map(entry.keyed);
		const staticPaths = entry.staticPaths as GetStaticPathsResultKeyed;
		staticPaths.keyed = keyed;
		routeCache.set(entry.route as RouteData, {
			staticPaths,
			route: entry.route,
		});
	}
}

export function findPathItemByKey(
	staticPaths: GetStaticPathsResultKeyed,
	params: Params,
	route: RouteData,
	logger: Logger,
	trailingSlash: AstroConfig['trailingSlash'],
) {
	const paramsKey = stringifyParams(params, route, trailingSlash);
	const matchedStaticPath = staticPaths.keyed.get(paramsKey);
	if (matchedStaticPath) {
		return matchedStaticPath;
	}
	logger.debug('router', `findPathItemByKey() - Unexpected cache miss looking for ${paramsKey}`);
}
