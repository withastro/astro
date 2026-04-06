import type { SerializedRouteData } from 'astro/app/manifest';

/**
 * A pathname with its serialized route data, used for prerendering over HTTP.
 */
interface SerializedPathWithRoute {
	pathname: string;
	route: SerializedRouteData;
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
}

export interface SerializedStaticImageEntry {
	originalPath: string;
	originalSrcPath: string | undefined;
	transforms: Array<{
		hash: string;
		finalPath: string;
		transform: Record<string, any>;
		/** Base64-encoded transformed image data, present when the IMAGES binding was used at build time. */
		imageData?: string;
	}>;
}

export type StaticImagesResponse = SerializedStaticImageEntry[];
