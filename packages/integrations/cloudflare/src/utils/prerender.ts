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

interface StaticImagesOptions {
	/** The Cloudflare IMAGES binding for image transformation. */
	images?: ImagesBinding;
	/** The Cloudflare ASSETS fetcher for loading local images. */
	assets?: Fetcher;
}

/** Serializes the global staticImages map collected in workerd back to the Node-side build.
 *  When IMAGES and ASSETS bindings are provided, transforms images using the Cloudflare
 *  binding and includes the optimized bytes in the response. */
export async function handleStaticImagesRequest(options?: StaticImagesOptions): Promise<Response> {
	const staticImages = globalThis.astroAsset?.staticImages;
	if (!staticImages || staticImages.size === 0) {
		return new Response('[]', {
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const { images, assets } = options ?? {};
	const canTransform = !!images && !!assets;

	const entries: StaticImagesResponse = [];
	for (const [originalPath, { originalSrcPath, transforms }] of staticImages) {
		const serializedTransforms: SerializedStaticImageEntry['transforms'] = [];
		for (const [hash, { finalPath, transform }] of transforms) {
			let imageData: string | undefined;

			if (canTransform) {
				try {
					imageData = await transformWithBinding(originalPath, transform, images, assets);
				} catch {
					// If the IMAGES binding fails, fall back to metadata-only
					// so the Node side can use Sharp as a fallback.
				}
			}

			serializedTransforms.push({
				hash,
				finalPath,
				transform: transform as Record<string, any>,
				imageData,
			});
		}
		entries.push({ originalPath, originalSrcPath, transforms: serializedTransforms });
	}

	return new Response(JSON.stringify(entries), {
		headers: { 'Content-Type': 'application/json' },
	});
}

const qualityTable: Record<string, number> = {
	low: 25,
	mid: 50,
	high: 80,
	max: 100,
};

const formatTable: Record<string, string> = {
	jpeg: 'image/jpeg',
	jpg: 'image/jpeg',
	png: 'image/png',
	gif: 'image/gif',
	webp: 'image/webp',
	avif: 'image/avif',
};

/** Transforms a single image using the Cloudflare IMAGES binding and returns base64-encoded data. */
async function transformWithBinding(
	originalPath: string,
	transform: Record<string, any>,
	images: ImagesBinding,
	assets: Fetcher,
): Promise<string> {
	// Load the original image via the ASSETS binding
	const content = await assets.fetch(new URL(originalPath, 'https://placeholder.host'));
	if (!content.body) {
		throw new Error(`Failed to load image: ${originalPath}`);
	}

	const input = images.input(content.body);

	const outputFormat = formatTable[transform.format ?? ''] ?? 'image/webp';

	const quality =
		typeof transform.quality === 'string'
			? qualityTable[transform.quality]
			: typeof transform.quality === 'number'
				? transform.quality
				: undefined;

	const result = await input
		.transform({
			width: transform.width ?? undefined,
			height: transform.height ?? undefined,
			fit: transform.fit ?? undefined,
		})
		.output({
			quality,
			format: outputFormat as any,
		});

	const response = result.response();
	const buffer = await response.arrayBuffer();

	// Encode as base64 for JSON transport
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary);
}
