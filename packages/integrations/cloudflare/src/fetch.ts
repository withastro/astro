/**
 * Cloudflare handler for use with `astro/fetch`.
 *
 * Usage in `src/app.ts`:
 *
 * ```ts
 * import { astro, FetchState } from 'astro/fetch';
 * import { cf } from '@astrojs/cloudflare/fetch';
 *
 * export default {
 *   async fetch(request: Request) {
 *     const state = new FetchState(request);
 *     const asset = await cf(state, env, ctx);
 *     if (asset) return asset;
 *     return astro(state);
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
} from './utils/cf.js';

setGetEnv(createGetEnv(globalEnv));

const app = createApp();

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
	injectSessionBinding(app.manifest, env);

	const staticAsset = matchStaticAsset(app.manifest, state.request.url, env);
	if (staticAsset) return staticAsset;

	if (!state.routeData) {
		const asset = await fallbackToAssets(state.request.url, env);
		if (asset) return asset;
	}

	Object.assign(state.locals, createLocals(ctx));
	state.clientAddress = getClientAddress(state.request);
	state.renderOptions.waitUntil = ctx.waitUntil.bind(ctx);
	state.renderOptions.prerenderedErrorPageFetch = createErrorPageFetch(env);

	return undefined;
}
