/**
 * Astro's Hono integration — virtual module entry point.
 *
 * This module imports from virtual modules (virtual:astro:manifest, virtual:astro:app)
 * and re-exports pre-configured middleware and factories that use those virtual deps.
 *
 * Users import from 'astro/hono' and get middleware pre-bound to the current
 * manifest/pipeline. For usage outside of Vite (e.g. production App class),
 * import the factory functions from './hono-app.js' directly.
 */
import { Hono } from 'hono';
import type { MiddlewareHandler } from 'hono';
import { removeBase } from '@astrojs/internal-helpers/path';
import { manifest } from 'virtual:astro:manifest';
import { app } from 'virtual:astro:app';
import {
	createAstroApp as createAstroAppFromDeps,
	createAstroMiddleware,
	createContextFactory,
	createMatchRouteData,
	createRedirectsMiddleware,
	createActionsMiddleware,
	createRewriteMiddleware,
	createI18nMiddleware,
	createPagesMiddleware,
	type AstroHonoEnv,
	type CreateAstroAppOptions,
} from './hono-app.js';
import { createConsoleLogger } from './logging.js';
import type { RoutesList } from '../../types/astro.js';
import type { RedirectConfig } from '../../types/public/index.js';

export { Hono };
export type { AstroHonoEnv, AstroAppDeps } from './hono-app.js';
export { ASTRO_ROUTE_DATA_KEY, ASTRO_REWRITE_PATHNAME_KEY } from './hono-app.js';

// Use lazy getters so that `app` is not accessed at module top-level.
// When the default `astro:user-app` is used there is a circular import:
//   virtual:astro:app → prod.ts → astro:user-app → astro/hono (this file) → virtual:astro:app
// Eagerly reading `app.pipeline` here would hit a TDZ error because `app`
// hasn't been initialised yet. Deferring via a getter breaks the cycle.
let _pipeline: typeof app.pipeline | undefined;
const logger = createConsoleLogger(manifest.logLevel);

let _manifestDataOverride: RoutesList | undefined;
const deps = {
	get pipeline() { return _pipeline ??= app.pipeline; },
	manifest,
	get manifestData() { return _manifestDataOverride ?? app.manifestData; },
	set manifestData(value: RoutesList) { _manifestDataOverride = value; },
	logger,
};

// Also defer createMatchRouteData / createContextFactory so they don't
// destructure `deps` (and thus touch `app`) at module top-level.
let _matchRouteData: ReturnType<typeof createMatchRouteData> | undefined;
let _contextFactory: ReturnType<typeof createContextFactory> | undefined;
function getMatchRouteData() {
	return _matchRouteData ??= createMatchRouteData(deps);
}
function getContextFactory() {
	return _contextFactory ??= createContextFactory(deps, getMatchRouteData());
}

// ---------------------------------------------------------------------------
// Pre-bound exports for user consumption (imported from 'astro/hono')
// ---------------------------------------------------------------------------

/**
 * Creates (or returns a cached) Astro API context from a Hono context.
 * Provides access to cookies, locals, params, clientAddress, session, etc.
 */
export const context = ((c: any) => getContextFactory()(c)) as ReturnType<typeof createContextFactory>;

/**
 * Redirect middleware. Without arguments, handles redirects defined in the Astro config.
 * With a config object, handles custom redirect mappings.
 */
export function redirects(config?: Record<string, RedirectConfig>): MiddlewareHandler<AstroHonoEnv> {
	if (config) {
		return async (c, next) => {
			const url = new URL(c.req.url);
			const pathname = removeBase(url.pathname, manifest.base);
			for (const [from, to] of Object.entries(config)) {
				const pattern = new RegExp(
					`^${from.replace(/\[[^\]]+\]/g, '(?:[^/]+)').replace(/\[\.\.\.[^\]]+\]/g, '(?:.*)')}$`,
				);
				if (pattern.test(pathname)) {
					const status = typeof to === 'object' ? to.status : c.req.method === 'GET' ? 301 : 308;
					const destination = typeof to === 'object' ? to.destination : to;
					return c.redirect(destination, status);
				}
			}
			return next();
		};
	}
	return createRedirectsMiddleware(deps);
}

/** Actions middleware — handles RPC calls and form submissions. */
export function actions(): MiddlewareHandler<AstroHonoEnv> {
	return createActionsMiddleware(deps, getContextFactory());
}

/** Rewrite middleware — processes rewrite directives from i18n and user code. */
export function rewrite(_options?: CreateAstroAppOptions): MiddlewareHandler<AstroHonoEnv> {
	return createRewriteMiddleware(deps, getContextFactory(), getMatchRouteData());
}

/** i18n middleware — handles locale detection and redirects. */
export function i18n(): MiddlewareHandler<AstroHonoEnv> {
	return createI18nMiddleware(deps, getMatchRouteData());
}

/**
 * Composed Astro middleware — handles the complete request lifecycle:
 * trailing slash, redirects, user middleware, actions, rewrites, i18n, and page rendering.
 */
export function astro(options?: CreateAstroAppOptions): MiddlewareHandler<AstroHonoEnv> {
	return createAstroMiddleware(deps, options);
}

/** Pages middleware — matches and renders pages/endpoints/redirects. */
export function pages(options?: CreateAstroAppOptions): MiddlewareHandler<AstroHonoEnv> {
	return createPagesMiddleware(deps, getContextFactory(), getMatchRouteData(), options);
}

/**
 * Creates a fully configured Hono app with Astro's middleware and route handlers.
 * Uses the manifest and pipeline from the virtual modules.
 */
export function createAstroApp(options?: CreateAstroAppOptions) {
	return createAstroAppFromDeps(deps, options);
}
