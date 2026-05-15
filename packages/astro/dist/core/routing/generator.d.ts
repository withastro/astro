import type { AstroConfig } from '../../types/public/config.js';
import type { RoutePart } from '../../types/public/internal.js';
type RouteGenerator = (data?: any) => string;
export declare function getRouteGenerator(
	segments: RoutePart[][],
	addTrailingSlash: AstroConfig['trailingSlash'],
): RouteGenerator;
export {};
