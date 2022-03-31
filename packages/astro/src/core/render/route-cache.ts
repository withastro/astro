import type { ComponentInstance, GetStaticPathsItem, GetStaticPathsResult, GetStaticPathsResultKeyed, Params, RouteData, RSS } from '../../@types/astro';
import { LogOptions, warn, debug } from '../logger/core.js';

import { generatePaginateFunction } from './paginate.js';
import { validateGetStaticPathsModule, validateGetStaticPathsResult } from '../routing/validation.js';

type RSSFn = (...args: any[]) => any;

function stringifyParams(params: Params) {
	// Always sort keys before stringifying to make sure objects match regardless of parameter ordering
	return JSON.stringify(params, Object.keys(params).sort());
}

interface CallGetStaticPathsOptions {
	mod: ComponentInstance;
	route: RouteData;
	isValidate: boolean;
	logging: LogOptions;
	ssr: boolean;
}

export async function callGetStaticPaths({ isValidate, logging, mod, route, ssr }: CallGetStaticPathsOptions): Promise<RouteCacheEntry> {
	validateGetStaticPathsModule(mod, { ssr });
	const resultInProgress = {
		rss: [] as RSS[],
	};

	let staticPaths: GetStaticPathsResult = [];
	if (mod.getStaticPaths) {
		staticPaths = (
			await mod.getStaticPaths({
				paginate: generatePaginateFunction(route),
				rss: (data) => {
					resultInProgress.rss.push(data);
				},
			})
		).flat();
	}

	const keyedStaticPaths = staticPaths as GetStaticPathsResultKeyed;
	keyedStaticPaths.keyed = new Map<string, GetStaticPathsItem>();
	for (const sp of keyedStaticPaths) {
		const paramsKey = stringifyParams(sp.params);
		keyedStaticPaths.keyed.set(paramsKey, sp);
	}
	if (isValidate) {
		validateGetStaticPathsResult(keyedStaticPaths, logging);
	}
	return {
		rss: resultInProgress.rss,
		staticPaths: keyedStaticPaths,
	};
}

export interface RouteCacheEntry {
	staticPaths: GetStaticPathsResultKeyed;
	rss: RSS[];
}

/**
 * Manange the route cache, responsible for caching data related to each route,
 * including the result of calling getStaticPath() so that it can be reused across
 * responses during dev and only ever called once during build.
 */
export class RouteCache {
	private logging: LogOptions;
	private cache: Record<string, RouteCacheEntry> = {};

	constructor(logging: LogOptions) {
		this.logging = logging;
	}

	/** Clear the cache. */
	clearAll() {
		this.cache = {};
	}

	set(route: RouteData, entry: RouteCacheEntry): void {
		// NOTE: This shouldn't be called on an already-cached component.
		// Warn here so that an unexpected double-call of getStaticPaths()
		// isn't invisible and developer can track down the issue.
		if (this.cache[route.component]) {
			warn(this.logging, 'routeCache', `Internal Warning: route cache overwritten. (${route.component})`);
		}
		this.cache[route.component] = entry;
	}

	get(route: RouteData): RouteCacheEntry | undefined {
		return this.cache[route.component];
	}
}

export function findPathItemByKey(staticPaths: GetStaticPathsResultKeyed, params: Params) {
	const paramsKey = stringifyParams(params);
	let matchedStaticPath = staticPaths.keyed.get(paramsKey);
	if (matchedStaticPath) {
		return matchedStaticPath;
	}

	debug('findPathItemByKey', `Unexpected cache miss looking for ${paramsKey}`);
	matchedStaticPath = staticPaths.find(({ params: _params }) => JSON.stringify(_params) === paramsKey);
}
