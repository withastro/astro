/**
 * Factory for creating the Astro Hono app.
 *
 * This module does NOT import from virtual modules. All dependencies are
 * passed in via the `AstroAppDeps` object, so the same factory can be used
 * by the dev virtual module (which reads from virtual:astro:manifest) and by
 * BaseApp (which has the manifest from its constructor).
 */
import { Hono } from 'hono';
import type { Context as HonoContext, MiddlewareHandler } from 'hono';
import { attachCookiesToResponse } from '../cookies/response.js';
import type { SSRManifest } from '../../types/public/index.js';
import type { APIContext } from '../../types/public/context.js';
import type { RouteData } from '../../types/public/internal.js';
import { createAstroHandler } from '../routing/handler.js';
import { createMatchRouteData } from '../routing/match-route-data.js';
import { createRedirectsHandler } from '../redirects/handler.js';
import { createRewritesHandler } from '../rewrites/handler.js';
import { createI18nHandler } from '../../i18n/handler.js';

import { createPagesHandler } from '../pages/handler.js';
import { createActionsHandler } from '../../actions/handler.js';

import type { PrepareOptions } from './prepare.js';
import { FetchState } from './fetch-state.js';
import type { Pipeline } from '../base-pipeline.js';
import type { AstroLogger } from '../logger/core.js';


export { Hono };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AstroAppDeps {
	pipeline: Pipeline;
	manifest: SSRManifest;
	logger: AstroLogger;
}

/**
 * Symbol used to store mutable deps on the Hono app instance.
 * This allows createAstroServerApp to update the deps (e.g. manifestData)
 * on the cached Hono app before each request.
 */
const ASTRO_APP_DEPS = Symbol.for('astro.appDeps');

const ASTRO_CONTEXT_KEY = 'astro.context';
const ASTRO_FETCH_STATE_KEY = 'astro.fetchState';

export type AstroHonoEnv = {
	Variables: {
		[ASTRO_CONTEXT_KEY]: APIContext;
		[ASTRO_FETCH_STATE_KEY]: FetchState;
	};
};

/** Get the FetchState from the Hono context, creating one if it doesn't exist yet. */
function getFetchState(c: HonoContext<AstroHonoEnv>, pipeline: Pipeline): FetchState {
	let state = c.get(ASTRO_FETCH_STATE_KEY);
	if (!state) {
		state = new FetchState(c.req.raw, pipeline);
		c.set(ASTRO_FETCH_STATE_KEY, state);
	}
	return state;
}

// ---------------------------------------------------------------------------
// Context factory
// ---------------------------------------------------------------------------

function createContextFactory(deps: AstroAppDeps) {
	const { pipeline } = deps;

	return async function context(c: HonoContext<any>): Promise<APIContext> {
		const existing = c.get(ASTRO_CONTEXT_KEY);
		if (existing) return existing;

		const state = getFetchState(c, pipeline);
		const ctx = await state.getAPIContext();
		c.set(ASTRO_CONTEXT_KEY, ctx);
		return ctx;
	};
}

// ---------------------------------------------------------------------------
// Middleware factories
// ---------------------------------------------------------------------------

function createRedirectsMiddleware(deps: AstroAppDeps): MiddlewareHandler<AstroHonoEnv> {
	const handleRedirect = createRedirectsHandler(deps.manifest);

	return async (c, next) => {
		const response = handleRedirect(c.req.raw);
		if (response) return response;
		return next();
	};
}

function createActionsMiddleware(
	deps: AstroAppDeps,
): MiddlewareHandler<AstroHonoEnv> {
	const { pipeline } = deps;
	const handleActions = createActionsHandler(deps);

	return async (c, next) => {
		const state = getFetchState(c, pipeline);
		const response = await handleActions(state);
		if (response) return response;
		return next();
	};
}

function createRewriteMiddleware(
	deps: AstroAppDeps,
	matchRouteData: (req: Request) => RouteData | undefined,
): MiddlewareHandler<AstroHonoEnv> {
	const { pipeline } = deps;
	const handleRewrite = createRewritesHandler(deps, matchRouteData);

	return async (c, next) => {
		await next();

		const state = getFetchState(c, pipeline);
		const response = await handleRewrite(state);
		if (response) {
			c.res = response;
		}
	};
}

function createI18nMiddleware(
	deps: AstroAppDeps,
	matchRouteData: (req: Request) => RouteData | undefined,
): MiddlewareHandler<AstroHonoEnv> {
	const { pipeline, manifest } = deps;
	const handleI18n = createI18nHandler(manifest, matchRouteData);

	if (!handleI18n) {
		return async (_c, next) => next();
	}

	return async (c, next) => {
		await next();

		const state = getFetchState(c, pipeline);
		const result = handleI18n(state, c.res);
		if (result) {
			c.res = result;
		}
	};
}

// ---------------------------------------------------------------------------
// Pages middleware (renders matched routes)
// ---------------------------------------------------------------------------

function createPagesMiddleware(
	deps: AstroAppDeps,
	matchRouteData: (req: Request) => RouteData | undefined,
	options: CreateAstroAppOptions = {},
): MiddlewareHandler<AstroHonoEnv> {
	const { pipeline } = deps;
	const handlePages = createPagesHandler(deps, matchRouteData, options);

	return async (c, _next) => {
		const state = getFetchState(c, pipeline);
		c.res = await handlePages(state);
		// Re-attach cookies to c.res because Hono clones the response on
		// assignment, losing any symbols set on the original object.
		const ctx = await state.getAPIContext();
		attachCookiesToResponse(c.res, ctx.cookies);
	};
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Composed astro() middleware
// ---------------------------------------------------------------------------

/**
 * Creates the fully composed Astro middleware that handles the complete
 * request lifecycle. Delegates to `createAstroHandler` (framework-agnostic)
 * and wraps it in Hono middleware for cookie symbol re-attachment.
 */
export function createAstroMiddleware(
	deps: AstroAppDeps,
	options: CreateAstroAppOptions = {},
): MiddlewareHandler<AstroHonoEnv> {
	const { pipeline } = deps;
	const handle = createAstroHandler(deps, options);

	return async (c, _next) => {
		const state = getFetchState(c, pipeline);
		c.res = await handle(state);
		// Re-attach cookies to c.res because Hono clones the response on
		// assignment, losing any symbols set on the original object.
		const ctx = await state.getAPIContext();
		attachCookiesToResponse(c.res, ctx.cookies);
	};
}

// ---------------------------------------------------------------------------
// App factory
// ---------------------------------------------------------------------------

export interface CreateAstroAppOptions extends PrepareOptions {
	isDev?: boolean;
	/**
	 * Whether to match prerendered routes. Defaults to `isDev` when not set.
	 * During build, set this to `true` with `isDev: false` so prerendered
	 * routes can be rendered while still keeping `onError` active.
	 */
	allowPrerenderedRoutes?: boolean;
	/** Whether to add Set-Cookie headers to the response. Defaults to true. */
	addCookieHeader?: boolean;
}

/**
 * Creates a fully configured Hono app with Astro's middleware pipeline and
 * page rendering. This is the shared factory used by both the dev virtual
 * module and the production App class.
 */
export function createAstroApp(deps: AstroAppDeps, options: CreateAstroAppOptions = {}): Hono<AstroHonoEnv> {
	const app = new Hono<AstroHonoEnv>();
	const isDev = options.isDev ?? (deps.pipeline.runtimeMode === 'development');
	if (isDev) {
		// In dev, re-throw errors so they propagate out of fetch() and the
		// dev server can show the Vite error overlay. Without this, Hono's
		// default handler catches the error and returns a bare "Internal
		// Server Error" text response.
		app.onError((err) => { throw err; });
	} else {
		// In production/build, catch unhandled errors and return a JSON 500
		// so adapters and BuildApp can inspect the status and error message.
		app.onError((err) => {
			const message = err instanceof Error ? err.message : String(err);
			return new Response(JSON.stringify({ error: message }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		});
	}
	app.use(createAstroMiddleware(deps, options));

	// Store deps on the app so they can be updated externally
	// (e.g. by createAstroServerApp to sync routes).
	Reflect.set(app, ASTRO_APP_DEPS, deps);

	return app;
}

// Re-export factories for individual middleware creation
export {
	createContextFactory,
	createMatchRouteData,
	createRedirectsMiddleware,
	createActionsMiddleware,
	createRewriteMiddleware,
	createI18nMiddleware,
	createPagesMiddleware,
};

export { FetchState };
