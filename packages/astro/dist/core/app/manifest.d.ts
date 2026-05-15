import type { SerializedRouteData } from '../../types/astro.js';
import type { AstroConfig, RouteData } from '../../types/public/index.js';
import type { RoutesList } from '../../types/astro.js';
import type {
	RouteInfo,
	SerializedSSRManifest,
	SSRManifest,
	SerializedRouteInfo,
} from './types.js';
export type { SerializedRouteData } from '../../types/astro.js';
export declare function deserializeManifest(
	serializedManifest: SerializedSSRManifest,
	routesList?: RoutesList,
): SSRManifest;
export declare function serializeRouteData(
	routeData: RouteData,
	trailingSlash: AstroConfig['trailingSlash'],
): SerializedRouteData;
export declare function deserializeRouteData(rawRouteData: SerializedRouteData): RouteData;
export declare function serializeRouteInfo(
	routeInfo: RouteInfo,
	trailingSlash: AstroConfig['trailingSlash'],
): SerializedRouteInfo;
export declare function deserializeRouteInfo(rawRouteInfo: SerializedRouteInfo): RouteInfo;
export declare function queuePoolSize(
	config: NonNullable<SSRManifest['experimentalQueuedRendering']>,
): number;
export declare function queueRenderingEnabled(
	config: SSRManifest['experimentalQueuedRendering'],
): boolean;
