/**
 * Cloudflare handler for use with `astro/fetch`.
 *
 * Usage in `src/app.ts`:
 *
 * ```ts
 * import { astro } from 'astro/fetch';
 * import { cf, createFetchState } from '@astrojs/cloudflare/fetch';
 *
 * export default {
 *   async fetch(request: Request, env: Env, ctx: ExecutionContext) {
 *     const state = createFetchState(request);
 *     const asset = await cf(state, env, ctx);
 *     if (asset) return asset;
 *     return astro(state);
 *   }
 * }
 * ```
 */
import { env as globalEnv } from 'cloudflare:workers';
import { FetchState } from 'astro/fetch';
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

// Well-known symbol used by `FetchState` to resolve the Astro app from
// a request. Matches the definition in `astro/src/core/constants.ts`.
const appSymbol = Symbol.for('astro.app');

// Lazy initialization — `createApp` and `setGetEnv` are deferred to the
// first call so that this module can be statically imported from a
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
 * Creates a `FetchState` for use in a custom Cloudflare worker entrypoint.
 *
 * Lazily initializes the Astro app and attaches it to the request so that
 * `FetchState`, `astro()`, and the other `astro/fetch` helpers can resolve
 * the pipeline. Use this instead of `new FetchState(request)` in custom
 * worker entrypoints; the adapter's default entrypoint does not need it.
 */
export function createFetchState(request: Request): FetchState {
	ensureInitialized();
	Reflect.set(request, appSymbol, app);
	return new FetchState(request);
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
