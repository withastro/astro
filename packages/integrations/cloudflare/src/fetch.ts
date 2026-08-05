/**
 * Cloudflare handler for use with `astro/fetch`.
 *
 * Usage in `src/app.ts`:
 *
 * ```ts
 * import { astro, FetchState } from 'astro/fetch';
 * import { cf, cfResponse } from '@astrojs/cloudflare/fetch';
 *
 * export default {
 *   async fetch(request: Request) {
 *     const state = new FetchState(request);
 *     const asset = await cf(state, env, ctx);
 *     if (asset) return asset;
 *     return cfResponse(await astro(state));
 *   }
 * }
 * ```
 */
import { env as globalEnv } from 'cloudflare:workers';
import {
	isPrerender,
	compileImageConfig,
	cacheProviderEnabled,
} from 'virtual:astro-cloudflare:config';
import type { FetchState } from 'astro/fetch';
import { createApp } from 'astro/app/entrypoint';
import { setGetEnv } from 'astro/env/setup';
import { createGetEnv } from './utils/env.js';
import {
	isStaticPathsRequest,
	isPrerenderRequest,
	handleStaticPathsRequest,
	handlePrerenderRequest,
	isStaticImagesRequest,
	handleStaticImagesRequest,
	isImageTransformRequest,
	handleImageTransformRequest,
	installPrerenderErrorPropagation,
} from './utils/prerender.js';
import {
	injectSessionBinding,
	matchStaticAsset,
	fallbackToAssets,
	createErrorPageFetch,
	createLocals,
	getClientAddress,
} from './utils/cf.js';

declare global {
	var __ASTRO_IMAGES_BINDING_NAME: string;
}

// Lazy initialization — `createApp` and `setGetEnv` are deferred to the
// first `cf()` call so that this module can be statically imported from a
// custom `fetchFile` without triggering a circular-dependency crash.
// (The cycle: fetch.ts → astro/app/entrypoint → virtual:astro:fetchable → user worker → fetch.ts)
let app: ReturnType<typeof createApp> | undefined;

function ensureInitialized() {
	if (!app) {
		setGetEnv(createGetEnv(globalEnv));
		app = createApp();
		if (isPrerender) {
			installPrerenderErrorPropagation(app);
		}
	}
}

/**
 * Applies Cloudflare-specific setup to a `FetchState`:
 * - Handles prerender endpoints during the build phase
 * - Injects the SESSION KV binding
 * - Serves static assets via the ASSETS binding
 * - Falls back to the ASSETS binding for unmatched routes (`run_worker_first`)
 * - Sets `locals.cfContext`, client address, `waitUntil`, error page fetch,
 *   and `addCookieHeader`
 *
 * Returns a `Response` if the request was handled (static file, asset
 * fallback, or prerender endpoint). Returns `undefined` when the caller
 * should continue to Astro rendering.
 */
export async function cf(
	state: FetchState,
	env: Env,
	ctx: ExecutionContext,
): Promise<Response | undefined> {
	ensureInitialized();

	// Handle prerender endpoints (only active during build prerender phase)
	if (isPrerender) {
		const request = state.request;

		if (compileImageConfig) {
			const { installAddStaticImage } = await import('./utils/static-image-collection.js');
			installAddStaticImage(compileImageConfig);
		}

		if (isStaticPathsRequest(request)) {
			return handleStaticPathsRequest(app!);
		}
		if (isPrerenderRequest(request)) {
			return handlePrerenderRequest(app!, request);
		}
		if (isStaticImagesRequest(request)) {
			return handleStaticImagesRequest();
		}
		if (isImageTransformRequest(request)) {
			const imagesBindingName = globalThis.__ASTRO_IMAGES_BINDING_NAME;
			return handleImageTransformRequest(request, {
				images:
					compileImageConfig?.transformWithBinding && imagesBindingName
						? (env as Record<string, any>)[imagesBindingName]
						: undefined,
				assets: compileImageConfig?.transformWithBinding ? env.ASSETS : undefined,
			});
		}
	}

	injectSessionBinding(app!.manifest, env);

	const staticAsset = matchStaticAsset(app!.manifest, state.request.url, env);
	if (staticAsset) return staticAsset;

	// Use app.match() directly: FetchState.routeData always resolves to a
	// route (falling back to the internal 404 route), so checking
	// `!state.routeData` would never be true. app.match() returns
	// `undefined` when nothing matches, which is the signal to try the
	// ASSETS binding for `run_worker_first` routing.
	const routeMatched = app!.match(state.request);
	if (!routeMatched) {
		const asset = await fallbackToAssets(state.request.url, env);
		if (asset) return asset;
	}

	Object.assign(state.locals, createLocals(ctx));
	state.clientAddress = getClientAddress(state.request);
	state.renderOptions.addCookieHeader = true;
	state.renderOptions.waitUntil = ctx.waitUntil.bind(ctx);
	state.renderOptions.prerenderedErrorPageFetch = createErrorPageFetch(env);

	return undefined;
}

/**
 * Applies Cloudflare-specific post-response headers:
 * - Defaults `Cloudflare-CDN-Cache-Control` to `no-store` when the cache
 *   provider is enabled and the response doesn't already set it.
 *
 * Handles immutable headers (e.g. responses from the Workers Cache API)
 * by rebuilding into a mutable `Response` on the first mutation error.
 *
 * Returns the (possibly rebuilt) response.
 */
export function cfResponse(response: Response): Response {
	if (!cacheProviderEnabled) return response;
	if (response.headers.has('Cloudflare-CDN-Cache-Control')) return response;

	try {
		response.headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
	} catch {
		// Responses from the Workers Cache API have immutable headers.
		response = new Response(response.body, response);
		response.headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
	}
	return response;
}
