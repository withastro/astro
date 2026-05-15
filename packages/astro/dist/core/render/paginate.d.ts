import type { PaginateFunction } from '../../types/public/common.js';
import type { AstroConfig } from '../../types/public/index.js';
import type { RouteData } from '../../types/public/internal.js';
export declare function generatePaginateFunction(
	routeMatch: RouteData,
	base: AstroConfig['base'],
	trailingSlash: AstroConfig['trailingSlash'],
): (...args: Parameters<PaginateFunction>) => ReturnType<PaginateFunction>;
