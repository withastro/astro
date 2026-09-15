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

import type { BaseApp, RenderErrorOptions } from 'astro/app';
import { renderForPrerender } from 'astro/app';
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
	IMAGE_TRANSFORM_ENDPOINT,
} from './prerender-constants.js';
import {
	transform as transformWithImagesBinding,
	transformStream as transformStreamWithImagesBinding,
} from './image-binding-transform.js';
import { createFramedPrerenderResponse } from './prerender-response.js';

/**
 * Replicates core's `BuildErrorHandler` semantics on the worker app during
 * the prerender phase. The production app converts render errors into a
 * rendered 500 error page, which makes a crash indistinguishable from a page
 * that intentionally returns an error status. During prerendering, a render
 * error must instead propagate as a throw so `handlePrerenderRequest` can
 * surface it to the build process, while intentional non-2xx responses
 * (e.g. a custom 404 page) still render through the default error handler.
 */
export function installPrerenderErrorPropagation(app: BaseApp): void {
	const originalRenderError = app.renderError.bind(app);
	app.renderError = async (request: Request, options: RenderErrorOptions): Promise<Response> => {
		if (options.status === 500) {
			if (options.response) {
				return options.response;
			}
			throw options.error;
		}
		return originalRenderError(request, options);
	};
}

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
		paths: paths.map(({ pathname, route, cacheKey }) => ({
			pathname,
			route: serializeRouteData(route, app.manifest.trailingSlash),
			cacheKey,
		})),
	};
	return new Response(JSON.stringify(response), {
		headers: { 'Content-Type': 'application/json' },
	});
}

/**
 * Handles a prerender request, rendering the specified page.
 *
 * The response body is fully buffered before being returned so that streaming
 * errors (e.g. a component throwing mid-render) are caught inside workerd and
 * surfaced as a 500 response.  Without buffering, the HTTP layer commits
 * status 200 before the stream completes, and a mid-stream error silently
 * truncates the HTML output.
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
	// Buffer the full body to catch streaming errors before the HTTP layer
	// commits a 200 status.
	try {
		// For incremental builds, `renderForPrerender` collects the content entries
		// and image transforms resolved during this render — scoped to this
		// request's async context, so concurrent prerender requests attribute
		// correctly. A length-prefixed JSON header carries the metadata before the
		// raw response bytes without requiring cross-request state.
		const { response, metadata } = await renderForPrerender(app, prerenderRequest, {
			routeData,
			collectMetadata: body.collectMetadata,
		});
		if (body.collectMetadata) {
			return createFramedPrerenderResponse(response, metadata);
		}
		// Non-collecting branch: buffer here so streaming errors are still caught
		// before the HTTP layer commits a 200.
		const bufferedBody = await response.arrayBuffer();
		return new Response(bufferedBody, {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		// Sanitize newlines and other control characters from the error message
		// before putting it in a header, as HTTP headers cannot contain them.
		const headerSafe = message.replace(/[\r\n]+/g, ' ');
		return new Response(message, {
			status: 500,
			headers: {
				'Content-Type': 'text/plain',
				'x-astro-prerender-error': headerSafe,
			},
		});
	}
}

export function isStaticImagesRequest(request: Request): boolean {
	const { pathname } = new URL(request.url);
	return pathname === STATIC_IMAGES_ENDPOINT && request.method === 'POST';
}

export function isImageTransformRequest(request: Request): boolean {
	const { pathname } = new URL(request.url);
	return pathname === IMAGE_TRANSFORM_ENDPOINT && request.method === 'POST';
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

interface ImageTransformOptions {
	/** The Cloudflare IMAGES binding for image transformation. */
	images?: ImagesBinding;
	/** The Cloudflare ASSETS fetcher for loading local images. */
	assets?: Fetcher;
}

/**
 * Transforms a single image with the Cloudflare IMAGES binding and streams the raw
 * bytes back to the Node-side build.
 *
 * The transform parameters arrive as query parameters on the request URL, in the same
 * shape `/_image` uses. Handling one image per request keeps peak memory proportional to
 * a single variant rather than to the whole image set, since neither the request body
 * nor the response body is ever buffered in the isolate.
 *
 * Local originals are uploaded as the request body: at this point in the build they live
 * in Astro's intermediate output, not in the client directory the ASSETS binding serves,
 * so the worker cannot fetch them itself. Remote images have no body and are resolved
 * here, exactly as the runtime `image-transform-endpoint` does.
 */
export async function handleImageTransformRequest(
	request: Request,
	{ images, assets }: ImageTransformOptions,
): Promise<Response> {
	if (!images) {
		return new Response('The Cloudflare IMAGES binding is not available in the prerender worker.', {
			status: 503,
		});
	}

	if (request.body) {
		return transformStreamWithImagesBinding(
			request.body,
			new URL(request.url).searchParams,
			images,
		);
	}

	if (!assets) {
		return new Response('The Cloudflare ASSETS binding is not available in the prerender worker.', {
			status: 503,
		});
	}
	return transformWithImagesBinding(request.url, images, assets);
}
