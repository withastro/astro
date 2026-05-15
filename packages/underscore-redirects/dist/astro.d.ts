import type { AstroConfig, HookParameters, IntegrationResolvedRoute } from 'astro';
import { type HostRouteDefinition, HostRoutes } from './host-route.js';
interface CreateRedirectsFromAstroRoutesParams {
	config: Pick<AstroConfig, 'build' | 'output' | 'base' | 'trailingSlash'>;
	/**
	 * Maps a `RouteData` to a dynamic target
	 */
	routeToDynamicTargetMap: Map<IntegrationResolvedRoute, string>;
	dir: URL;
	buildOutput: 'static' | 'server';
	assets: HookParameters<'astro:build:done'>['assets'];
}
/**
 * Returns the path(s) to use for a redirect entry based on the trailingSlash config.
 * - 'always': ensures the path ends with '/'
 * - 'never': ensures the path does not end with '/'
 * - 'ignore'(default): returns both with and without trailing slash variants
 */
export declare function getTrailingSlashPaths(
	inputPath: string,
	trailingSlash: 'always' | 'never' | 'ignore',
): string[];
/**
 * Takes a set of routes and creates a Redirects object from them.
 */
export declare function createRedirectsFromAstroRoutes({
	config,
	routeToDynamicTargetMap,
	dir,
	buildOutput,
	assets,
}: CreateRedirectsFromAstroRoutesParams): HostRoutes;
/**
 * Creates a hosted route definition from an `IntegrationResolveRoute`
 * @param route
 * @param config
 */
export declare function createHostedRouteDefinition(
	route: IntegrationResolvedRoute,
	config: AstroConfig,
): HostRouteDefinition;
export {};
