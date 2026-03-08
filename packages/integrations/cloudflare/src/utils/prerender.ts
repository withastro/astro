/**
 * Prerender utilities for Cloudflare adapter
 *
 * During the build process, Astro prerenders pages by making requests to internal endpoints
 * served by the Cloudflare worker running in workerd. These endpoints are:
 *
 * - `/__astro_static_paths`: Returns all static paths that need to be prerendered.
 *   The prerenderer calls this to discover which routes/pages need to be generated.
 *
 * - `/__astro_prerender`: Renders a specific page given its URL and route data.
 *   The prerenderer calls this for each path to generate the static HTML.
 *
 * These endpoints are only active during the prerender build phase and are not
 * available in production or development.
 */

import type { BaseApp } from 'astro/app';
import { serializeRouteData, deserializeRouteData } from 'astro/app/manifest';
import { StaticPaths } from 'astro:static-paths';
import type {
	StaticPathsResponse,
	PrerenderRequest,
	SerializedStaticImageEntry,
	StaticImagesResponse,
} from '../prerender-types.js';
import {
	STATIC_PATHS_ENDPOINT,
	PRERENDER_ENDPOINT,
	STATIC_IMAGES_ENDPOINT,
} from './prerender-constants.js';

/**
 * Checks if the request is for the static paths prerender endpoint.
 * This endpoint returns all paths that need to be prerendered.
 */
export function isStaticPathsRequest(request: Request): boolean {
	const { pathname } = new URL(request.url);
	return pathname === STATIC_PATHS_ENDPOINT && request.method === 'POST';
}

/**
 * Checks if the request is for the prerender endpoint.
 * This endpoint renders a specific page during the prerender phase.
 */
export function isPrerenderRequest(request: Request): boolean {
	const { pathname } = new URL(request.url);
	return pathname === PRERENDER_ENDPOINT && request.method === 'POST';
}

/**
 * Handles the static paths request, returning all paths that need prerendering.
 */
export async function handleStaticPathsRequest(app: BaseApp): Promise<Response> {
	const staticPaths = new StaticPaths(app);
	const paths = await staticPaths.getAll();
	const response: StaticPathsResponse = {
		paths: paths.map(({ pathname, route }) => ({
			pathname,
			route: serializeRouteData(route, app.manifest.trailingSlash),
		})),
	};
	return new Response(JSON.stringify(response), {
		headers: { 'Content-Type': 'application/json' },
	});
}

/**
 * Handles a prerender request, rendering the specified page.
 */
export async function handlePrerenderRequest(app: BaseApp, request: Request): Promise<Response> {
	const headers = new Headers();
	for (const [key, value] of request.headers.entries()) {
		headers.append(key, value);
	}
	const body: PrerenderRequest = await request.json();
	const routeData = deserializeRouteData(body.routeData);
	const prerenderRequest = new Request(body.url, {
		method: 'GET',
		headers,
	});
	return app.render(prerenderRequest, { routeData });
}

export function isStaticImagesRequest(request: Request): boolean {
	const { pathname } = new URL(request.url);
	return pathname === STATIC_IMAGES_ENDPOINT && request.method === 'POST';
}

/** Serializes the global staticImages map collected in workerd back to the Node-side build. */
export function handleStaticImagesRequest(): Response {
	const staticImages = globalThis.astroAsset?.staticImages;
	if (!staticImages || staticImages.size === 0) {
		return new Response('[]', {
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const entries: StaticImagesResponse = [];
	for (const [originalPath, { originalSrcPath, transforms }] of staticImages) {
		const serializedTransforms: SerializedStaticImageEntry['transforms'] = [];
		for (const [hash, { finalPath, transform }] of transforms) {
			serializedTransforms.push({
				hash,
				finalPath,
				transform: transform as Record<string, any>,
			});
		}
		entries.push({ originalPath, originalSrcPath, transforms: serializedTransforms });
	}

	return new Response(JSON.stringify(entries), {
		headers: { 'Content-Type': 'application/json' },
	});
}
