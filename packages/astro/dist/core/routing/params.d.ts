import type { GetStaticPathsItem } from '../../types/public/common.js';
import type { AstroConfig } from '../../types/public/index.js';
import type { RouteData } from '../../types/public/internal.js';
/**
 * given a route's Params object, validate parameter
 * values and create a stringified key for the route
 * that can be used to match request routes
 */
export declare function stringifyParams(
	params: GetStaticPathsItem['params'],
	route: RouteData,
	trailingSlash: AstroConfig['trailingSlash'],
): string;
