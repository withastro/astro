import type {
	ComponentInstance,
	GetStaticPathsItem,
	GetStaticPathsResult,
	GetStaticPathsResultKeyed,
	Params,
	RouteData,
} from '../../@types/astro';
import { debug, LogOptions, warn } from '../logger/core.js';

import { stringifyParams } from '../routing/params.js';
import { validateDynamicRouteModule, validateGetStaticPathsResult } from '../routing/validation.js';
import { generatePaginateFunction } from './paginate.js';

interface CallGetStaticPathsOptions {
	mod: ComponentInstance;
	route: RouteData;
	isValidate: boolean;
	logging: LogOptions;
	ssr: boolean;
}

export async function callGetStaticPaths({
	isValidate,
	logging,
	mod,
	route,
	ssr,
}: CallGetStaticPathsOptions): Promise<RouteCacheEntry> {
	validateDynamicRouteModule(mod, { ssr, logging });
	// No static paths in SSR mode. Return an empty RouteCacheEntry.
	if (ssr) {
		return { staticPaths: Object.assign([], { keyed: new Map() }) };
	}
	// Add a check here to my TypeScript happy.
	// This is already checked in validateDynamicRouteModule().
	if (!mod.getStaticPaths) {
		throw new Error('Unexpected Error.');
	}
	// Calculate your static paths.
	let staticPaths: GetStaticPathsResult = [];
	staticPaths = (
		await mod.getStaticPaths({
			paginate: generatePaginateFunction(route),
			rss() {
				throw new Error(
					'The RSS helper has been removed from getStaticPaths! Try the new @astrojs/rss package instead. See https://docs.astro.build/en/guides/rss/'
				);
			},
		})
	).flat();

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
		staticPaths: keyedStaticPaths,
	};
}

export interface RouteCacheEntry {
	staticPaths: GetStaticPathsResultKeyed;
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
			warn(
				this.logging,
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

export function findPathItemByKey(staticPaths: GetStaticPathsResultKeyed, params: Params) {
	const paramsKey = stringifyParams(params);
	let matchedStaticPath = staticPaths.keyed.get(paramsKey);
	if (matchedStaticPath) {
		return matchedStaticPath;
	}

	debug('findPathItemByKey', `Unexpected cache miss looking for ${paramsKey}`);
	matchedStaticPath = staticPaths.find(
		({ params: _params }) => JSON.stringify(_params) === paramsKey
	);
}
