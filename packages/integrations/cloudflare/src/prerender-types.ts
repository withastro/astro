import type { PrerenderRenderMetadata } from 'astro';
import type { SerializedRouteData } from 'astro/app/manifest';

/**
 * A pathname with its serialized route data, used for prerendering over HTTP.
 */
interface SerializedPathWithRoute {
	pathname: string;
	route: SerializedRouteData;
	cacheKey?: string;
}

/**
 * Response from the /__astro_static_paths endpoint.
 */
export interface StaticPathsResponse {
	paths: SerializedPathWithRoute[];
}

/**
 * Request body for the /__astro_prerender endpoint.
 */
export interface PrerenderRequest {
	url: string;
	routeData: SerializedRouteData;
	/**
	 * When true, the worker collects incremental-build metadata during the render
	 * and includes it in the framed response.
	 */
	collectMetadata?: boolean;
}

export interface PrerenderResponseMetadata {
	status: number;
	statusText: string;
	headers: [string, string][];
	hasBody: boolean;
	/**
	 * The metadata collected during the render, or `undefined` when no render
	 * scope could be installed in the worker (degraded collection — the path is
	 * recorded as "not tracked", which is distinct from tracked-but-empty).
	 */
	metadata?: PrerenderRenderMetadata;
}

export interface SerializedStaticImageEntry {
	originalPath: string;
	originalSrcPath: string | undefined;
	transforms: Array<{
		hash: string;
		finalPath: string;
		transform: Record<string, any>;
	}>;
}

export type StaticImagesResponse = SerializedStaticImageEntry[];
