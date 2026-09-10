/**
 * Cloudflare handler for use with `astro/fetch`.
 *
 * Usage in `src/app.ts`:
 *
 * ```ts
 * import { astro, FetchState } from 'astro/fetch';
 * import { cf, finalize } from '@astrojs/cloudflare/fetch';
 *
 * export default {
 *   async fetch(request: Request) {
 *     const state = new FetchState(request);
 *     const asset = await cf(state, env, ctx);
 *     if (asset) return asset;
 *     return finalize(state, await astro(state));
 *   }
 * }
 * ```
 */
import { env as globalEnv } from 'cloudflare:workers';
import type { FetchState } from 'astro/fetch';
import { createApp } from 'astro/app/entrypoint';
import { setGetEnv } from 'astro/env/setup';
import { cacheProviderEnabled } from 'virtual:astro-cloudflare:config';
import { createGetEnv } from './utils/env.js';
import { applyCloudflareResponseHeaders } from './utils/response.js';
import {
	injectSessionBinding,
	matchStaticAsset,
	fallbackToAssets,
	createErrorPageFetch,
	createLocals,
	getClientAddress,
} from './utils/cf.js';

// Lazy initialization — `createApp` and `setGetEnv` are deferred to the
// first `cf()` call so that this module can be statically imported from a
// custom `fetchFile` without triggering a circular-dependency crash.
// (The cycle: fetch.ts → astro/app/entrypoint → virtual:astro:fetchable → user worker → fetch.ts)
let app: ReturnType<typeof createApp> | undefined;

function ensureInitialized() {
	if (!app) {
		setGetEnv(createGetEnv(globalEnv));
		app = createApp();
	}
}

function hasMatchingRoute(state: FetchState): boolean {
	// When no Astro route matches, routeData can contain the fallback 404 route.
	// Comparing its pattern to the original pathname distinguishes that fallback
	// from a real match so the ASSETS binding gets a chance to handle the request.
	return state.routeData?.pattern.test(state.pathname) ?? false;
}

/** Applies cookies and Cloudflare CDN cache defaults to an Astro response. */
export function finalize(state: FetchState, response: Response): Response {
	return applyCloudflareResponseHeaders(response, state.cookies.consume(), cacheProviderEnabled);
}

/**
 * Applies Cloudflare-specific setup to a `FetchState`:
 * - Injects the SESSION KV binding
 * - Serves static assets via the ASSETS binding
 * - Sets `locals.cfContext`, client address, `waitUntil`, and error page fetch
 *
 * Returns a `Response` if the request was handled by the ASSETS binding
 * (static file hit). Returns `undefined` when the caller should continue
 * to Astro rendering.
 */
export async function cf(
	state: FetchState,
	env: Env,
	ctx: ExecutionContext,
): Promise<Response | undefined> {
	ensureInitialized();
	injectSessionBinding(app!.manifest, env);

	const staticAsset = matchStaticAsset(app!.manifest, state.request.url, env);
	if (staticAsset) return staticAsset;

	if (!hasMatchingRoute(state)) {
		const asset = await fallbackToAssets(state.request.url, env);
		if (asset) return asset;
	}

	Object.assign(state.locals, createLocals(ctx));
	state.clientAddress = getClientAddress(state.request);
	state.renderOptions.waitUntil = ctx.waitUntil.bind(ctx);
	state.renderOptions.prerenderedErrorPageFetch = createErrorPageFetch(env);

	return undefined;
}
