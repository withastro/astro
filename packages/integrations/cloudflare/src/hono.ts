/**
 * Cloudflare middleware for use with `astro/hono`.
 *
 * Usage in `src/app.ts`:
 *
 * ```ts
 * import { Hono } from 'hono';
 * import { actions, middleware, pages, i18n } from 'astro/hono';
 * import { cf } from '@astrojs/cloudflare/hono';
 *
 * const app = new Hono<{ Bindings: Env }>();
 *
 * app.use(cf());
 * app.use(actions());
 * app.use(middleware());
 * app.use(pages());
 * app.use(i18n());
 *
 * export default app;
 * ```
 */
import { FetchState } from 'astro/fetch';
import { cf as cfFetch } from './fetch.js';

const FETCH_STATE_KEY = 'fetchState';

/**
 * Duck-typed Hono context — matches Hono's `Context` shape for
 * Cloudflare Workers without importing from `hono` at runtime.
 */
type HonoCloudflareContextLike = {
	req: {
		raw: Request;
	};
	env: Env;
	executionCtx: ExecutionContext;
	get?: (key: string) => unknown;
	set?: (key: string, value: unknown) => void;
};

type HonoMiddlewareHandler = (
	context: HonoCloudflareContextLike,
	next: () => Promise<void>,
) => Promise<Response | void>;

function getFetchState(context: HonoCloudflareContextLike): FetchState {
	const state = context.get?.(FETCH_STATE_KEY) as FetchState | undefined;
	if (state) return state;

	const nextState = new FetchState(context.req.raw);
	context.set?.(FETCH_STATE_KEY, nextState);
	return nextState;
}

/**
 * Hono middleware that applies Cloudflare-specific setup.
 *
 * Reads `env` and `executionCtx` from the Hono context (provided
 * automatically by Hono on Cloudflare Workers). Handles static assets
 * via the ASSETS binding, injects the SESSION KV binding, and sets
 * `locals.cfContext`, client address, `waitUntil`, and error page fetch.
 *
 * If the request matches a static asset, returns the asset response
 * directly. Otherwise calls `next()` to continue the middleware chain.
 */
export function cf(): HonoMiddlewareHandler {
	return async (context, next) => {
		const state = getFetchState(context);
		const asset = await cfFetch(state, context.env, context.executionCtx);
		if (asset) return asset;
		await next();
	};
}
