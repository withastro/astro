/**
 * Use this module only to have functions needed in development
 */
import type { RoutesList } from '../../types/astro.js';
import type { SSRManifest } from '../app/types.js';
import type { RouteData } from '../../types/public/index.js';
import type { RunnablePipeline } from '../../vite-plugin-app/pipeline.js';
interface MatchedRoute {
	route: RouteData;
	filePath: URL;
	resolvedPathname: string;
}
export declare function matchRoute(
	pathname: string,
	routesList: RoutesList,
	pipeline: RunnablePipeline,
	manifest: SSRManifest,
): Promise<MatchedRoute | undefined>;
export {};
