import type { AstroSettings } from '../../types/astro.js';
import type { RouteData } from '../../types/public/internal.js';
/**
 * Settings needed to parse a route path into RouteData.
 */
type ParseRouteConfig = Pick<AstroSettings, 'config' | 'pageExtensions'>;
/**
 * Options for building the RouteData output.
 */
type ParseRouteOptions = {
	component: string;
	type?: RouteData['type'];
	origin?: RouteData['origin'];
	isIndex?: boolean;
	prerender?: boolean;
	params?: string[];
};
/**
 * Parse a file path-like route into RouteData, respecting extensions and config.
 */
export declare function parseRoute(
	route: string,
	options: ParseRouteConfig,
	parseOptions: ParseRouteOptions,
): RouteData;
export {};
