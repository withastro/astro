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
	 * and returns a `PrerenderEnvelope` instead of the raw response.
	 */
	incremental?: boolean;
}

/**
 * Response for an incremental prerender request. The raw response cannot carry
 * the render metadata on its own, so the body, status, and headers are wrapped
 * alongside the collected metadata.
 */
export interface PrerenderEnvelope {
	status: number;
	statusText: string;
	headers: [string, string][];
	/** Base64-encoded response body. */
	body: string;
	metadata: PrerenderRenderMetadata;
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
