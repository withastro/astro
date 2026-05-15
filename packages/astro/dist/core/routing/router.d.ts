import type { AstroConfig } from '../../types/public/config.js';
import type { Params } from '../../types/public/common.js';
import type { ValidRedirectStatus } from '../../types/public/config.js';
import type { RouteData } from '../../types/public/internal.js';
/**
 * Router options derived from the active Astro config.
 * Controls base matching, trailing slash handling, and build output format.
 */
export interface RouterOptions {
	base: AstroConfig['base'];
	trailingSlash: AstroConfig['trailingSlash'];
	buildFormat: NonNullable<AstroConfig['build']>['format'];
}
interface RouterMatchRoute {
	type: 'match';
	route: RouteData;
	params: Params;
	pathname: string;
}
interface RouterMatchRedirect {
	type: 'redirect';
	location: string;
	status: ValidRedirectStatus;
}
interface RouterMatchNone {
	type: 'none';
	reason: 'no-match' | 'outside-base';
}
/**
 * Result of routing a pathname.
 * - match: route was found, includes route data and params.
 * - redirect: canonical redirect (trailing slash or leading slash normalization).
 * - none: no match (either outside base or no route pattern matched).
 */
export type RouterMatch = RouterMatchRoute | RouterMatchRedirect | RouterMatchNone;
/**
 * Matches request pathnames against a route list with base and trailing slash rules.
 */
export declare class Router {
	#private;
	constructor(routes: RouteData[], options: RouterOptions);
	/**
	 * Match an input pathname against the route list.
	 * If allowWithoutBase is true, a non-base-prefixed path is still considered.
	 */
	match(
		inputPathname: string,
		{
			allowWithoutBase,
		}?: {
			allowWithoutBase?: boolean;
		},
	): RouterMatch;
}
export {};
