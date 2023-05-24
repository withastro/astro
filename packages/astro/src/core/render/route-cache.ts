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
import { debug, warn, type LogOptions } from '../logger/core.js';

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
	validateDynamicRouteModule(mod, { ssr, logging, route });
	// No static paths in SSR mode. Return an empty RouteCacheEntry.
	if (ssr && !route.prerender) {
		return { staticPaths: Object.assign([], { keyed: new Map() }) };
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

	// Flatten the array before validating the content, otherwise users using `.map` will run into errors
	if (Array.isArray(staticPaths)) {
		staticPaths = staticPaths.flat();
	}

	if (isValidate) {
		validateGetStaticPathsResult(staticPaths, logging, route);
	}

	const keyedStaticPaths = staticPaths as GetStaticPathsResultKeyed;
	keyedStaticPaths.keyed = new Map<string, GetStaticPathsItem>();

	for (const sp of keyedStaticPaths) {
		const paramsKey = stringifyParams(sp.params, route.component);
		keyedStaticPaths.keyed.set(paramsKey, sp);
	}

	return {
		staticPaths: keyedStaticPaths,
	};
}

export interface RouteCacheEntry {
	staticPaths: GetStaticPathsResultKeyed;
}

/**
 * Manage the route cache, responsible for caching data related to each route,
 * including the result of calling getStaticPath() so that it can be reused across
 * responses during dev and only ever called once during build.
 */
export class RouteCache {
	private logging: LogOptions;
	private cache: Record<string, RouteCacheEntry> = {};
	private mode: RuntimeMode;

	constructor(logging: LogOptions, mode: RuntimeMode = 'production') {
		this.logging = logging;
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
		if (this.mode === 'production' && this.cache[route.component]) {
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

export function findPathItemByKey(
	staticPaths: GetStaticPathsResultKeyed,
	params: Params,
	route: RouteData
) {
	const paramsKey = stringifyParams(params, route.component);
	const matchedStaticPath = staticPaths.keyed.get(paramsKey);
	if (matchedStaticPath) {
		return matchedStaticPath;
	}
	debug('findPathItemByKey', `Unexpected cache miss looking for ${paramsKey}`);
}
