import type { ComponentInstance } from '../../types/astro.js';
import type { Params, Props } from '../../types/public/common.js';
import type { AstroConfig } from '../../types/public/index.js';
import type { RouteData } from '../../types/public/internal.js';
import type { AstroLogger } from '../logger/core.js';
import type { RouteCache } from './route-cache.js';
interface GetParamsAndPropsOptions {
	mod: ComponentInstance | undefined;
	routeData?: RouteData | undefined;
	routeCache: RouteCache;
	pathname: string;
	logger: AstroLogger;
	serverLike: boolean;
	base: string;
	trailingSlash: AstroConfig['trailingSlash'];
}
export declare function getProps(opts: GetParamsAndPropsOptions): Promise<Props>;
/**
 * When given a route with the pattern `/[x]/[y]/[z]/svelte`, and a pathname `/a/b/c/svelte`,
 * returns the params object: { x: "a", y: "b", z: "c" }.
 */
export declare function getParams(route: RouteData, pathname: string): Params;
export {};
