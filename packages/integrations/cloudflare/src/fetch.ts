/**
 * Cloudflare handler for use with `astro/fetch`.
 *
 * Usage in `src/app.ts`:
 *
 * ```ts
 * import { astro, FetchState } from 'astro/fetch';
 * import { cf, finalizeResponse } from '@astrojs/cloudflare/fetch';
 *
 * export default {
 *   async fetch(request: Request, env: Env, ctx: ExecutionContext) {
 *     const state = new FetchState(request);
 *     const asset = await cf(state, env, ctx);
 *     if (asset) return asset;
 *     return finalizeResponse(await astro(state));
 *   }
 * }
 * ```
 */
import { env as globalEnv } from 'cloudflare:workers';
import type { FetchState } from 'astro/fetch';
import { createApp } from 'astro/app/entrypoint';
import { setGetEnv } from 'astro/env/setup';
import { createGetEnv } from './utils/env.js';
import {
	injectSessionBinding,
	matchStaticAsset,
	fallbackToAssets,
	createErrorPageFetch,
	createLocals,
	getClientAddress,
	finalizeCloudflareResponse,
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

/**
 * Applies Cloudflare-specific setup to a `FetchState`:
 * - Injects the SESSION KV binding
 * - Enables cookie headers (including session cookies) on the response
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

	// `state.routeData` is always set — `FetchState.#resolveRouteData()`
	// falls back to the internal 404 route when nothing matches. Use
	// `app.match()` instead, which returns `undefined` for unmatched
	// requests, so the ASSETS fallback can serve files that sit outside
	// the route manifest (needed for `run_worker_first` routing).
	if (!app!.match(state.request)) {
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
 * Applies Cloudflare-specific response defaults. When the Cloudflare
 * cache provider is configured and the response lacks a
 * `Cloudflare-CDN-Cache-Control` header, sets it to `no-store` so that
 * routes without explicit cache intent are not cached by the Worker
 * cache.
 *
 * Call this on the response returned by `astro(state)`:
 *
 * ```ts
 * return finalizeResponse(await astro(state));
 * ```
 *
 * The Hono middleware (`@astrojs/cloudflare/hono`) applies this
 * automatically after `next()`.
 */
export const finalizeResponse: (response: Response) => Response = finalizeCloudflareResponse;
