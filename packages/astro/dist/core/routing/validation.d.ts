import type { ComponentInstance } from '../../types/astro.js';
import type { GetStaticPathsResult } from '../../types/public/common.js';
import type { RouteData } from '../../types/public/internal.js';
/** Error for deprecated or malformed route components */
export declare function validateDynamicRouteModule(
	mod: ComponentInstance,
	{
		ssr,
		route,
	}: {
		ssr: boolean;
		route: RouteData;
	},
): void;
/** Throw error and log warnings for malformed getStaticPaths() response */
export declare function validateGetStaticPathsResult(
	result: GetStaticPathsResult,
	route: RouteData,
): void;
