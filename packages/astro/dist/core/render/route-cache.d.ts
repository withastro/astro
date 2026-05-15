import type { ComponentInstance } from '../../types/astro.js';
import type {
	GetStaticPathsItem,
	GetStaticPathsResultKeyed,
	Params,
} from '../../types/public/common.js';
import type { AstroConfig, RuntimeMode } from '../../types/public/config.js';
import type { RouteData } from '../../types/public/internal.js';
import type { AstroLogger } from '../logger/core.js';
interface CallGetStaticPathsOptions {
	mod: ComponentInstance | undefined;
	route: RouteData;
	routeCache: RouteCache;
	ssr: boolean;
	base: AstroConfig['base'];
	trailingSlash: AstroConfig['trailingSlash'];
}
export declare function callGetStaticPaths({
	mod,
	route,
	routeCache,
	ssr,
	base,
	trailingSlash,
}: CallGetStaticPathsOptions): Promise<GetStaticPathsResultKeyed>;
interface RouteCacheEntry {
	staticPaths: GetStaticPathsResultKeyed;
}
/**
 * Manage the route cache, responsible for caching data related to each route,
 * including the result of calling getStaticPath() so that it can be reused across
 * responses during dev and only ever called once during build.
 */
export declare class RouteCache {
	private logger;
	private cache;
	private runtimeMode;
	constructor(logger: AstroLogger, runtimeMode?: RuntimeMode);
	/** Clear the cache. */
	clearAll(): void;
	set(route: RouteData, entry: RouteCacheEntry): void;
	get(route: RouteData): RouteCacheEntry | undefined;
	key(route: RouteData): string;
}
export declare function findPathItemByKey(
	staticPaths: GetStaticPathsResultKeyed,
	params: Params,
	route: RouteData,
	logger: AstroLogger,
	trailingSlash: AstroConfig['trailingSlash'],
): GetStaticPathsItem | undefined;
export {};
