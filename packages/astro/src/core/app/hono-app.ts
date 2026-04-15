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
import {
	appendForwardSlash,
	collapseDuplicateTrailingSlashes,
	hasFileExtension,
	isInternalPath,
	joinPaths,
	prependForwardSlash,
	removeBase,
	removeTrailingForwardSlash,
} from '@astrojs/internal-helpers/path';
import { normalizeTheLocale } from '../../i18n/index.js';

import { clientAddressSymbol, NOOP_MIDDLEWARE_HEADER, REROUTABLE_STATUS_CODES, REROUTE_DIRECTIVE_HEADER, REWRITE_DIRECTIVE_HEADER_KEY, ROUTE_TYPE_HEADER } from '../constants.js';
import { PERSIST_SYMBOL } from '../session/runtime.js';
import { getRenderOptions, copyRenderOptions } from './render-options-store.js';

import { ForbiddenRewrite } from '../errors/errors-data.js';
import {
	getActionContext,
	parseRequestBody,
	serializeActionResult,
} from '../../actions/runtime/server.js';
import { ACTION_QUERY_PARAMS } from '../../actions/consts.js';
import { callMiddleware } from '../middleware/callMiddleware.js';
import { NOOP_MIDDLEWARE_FN } from '../middleware/noop-middleware.js';
import type { SSRManifest } from '../../types/public/index.js';
import type { APIContext } from '../../types/public/context.js';
import type { RouteData } from '../../types/public/internal.js';
import { createRedirectsHandler } from '../redirects/handler.js';
import { createRewritesHandler } from '../rewrites/handler.js';
import { createI18nHandler } from '../../i18n/handler.js';
import { attachCookiesToResponse, getSetCookiesFromResponse } from '../cookies/response.js';
import { AstroError } from '../errors/index.js';
import { applyCacheHeaders } from '../cache/runtime/cache.js';
import { PageRenderer } from './renderers/page.js';
import { EndpointRenderer } from './renderers/endpoint.js';
import { RedirectRenderer } from './renderers/redirect.js';
import { prepareForRender, renderErrorPage, type PrepareOptions } from './prepare.js';
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
// Domain locale resolution
// ---------------------------------------------------------------------------

function resolveDomainLocale(request: Request, manifest: SSRManifest): string | undefined {
	const i18n = manifest.i18n;
	if (
		!i18n ||
		(i18n.strategy !== 'domains-prefix-always' &&
			i18n.strategy !== 'domains-prefix-other-locales' &&
			i18n.strategy !== 'domains-prefix-always-no-redirect')
	) {
		return undefined;
	}

	const url = new URL(request.url);
	let host = request.headers.get('X-Forwarded-Host');
	let protocol = request.headers.get('X-Forwarded-Proto');
	if (protocol) {
		protocol = protocol + ':';
	} else {
		protocol = url.protocol;
	}
	if (!host) {
		host = request.headers.get('Host');
	}
	if (!host || !protocol) return undefined;

	host = host.split(':')[0];
	try {
		const hostAsUrl = new URL(`${protocol}//${host}`);
		for (const [domainKey, localeValue] of Object.entries(i18n.domainLookupTable)) {
			const domainKeyAsUrl = new URL(domainKey);
			if (
				hostAsUrl.host === domainKeyAsUrl.host &&
				hostAsUrl.protocol === domainKeyAsUrl.protocol
			) {
				return localeValue;
			}
		}
	} catch {
		// Invalid URL
	}
	return undefined;
}

// ---------------------------------------------------------------------------
// Route matching
// ---------------------------------------------------------------------------

function createMatchRouteData(deps: AstroAppDeps) {
	return function matchRouteData(request: Request, { allowPrerenderedRoutes = false } = {}): RouteData | undefined {
		// If the adapter already matched a route (e.g. via devMatch), use it
		// directly instead of re-matching. This is needed because some adapters
		// (like Cloudflare) run route matching in their own handler before
		// calling app.render().
		const preMatched = getRenderOptions(request)?.routeData;
		if (preMatched) return preMatched;

		const manifest = deps.manifest;
		const manifestData = deps.pipeline.manifestData;
		const url = new URL(request.url);
		if (manifest.assets.has(url.pathname)) return undefined;
		let strippedPathname = removeBase(decodeURI(url.pathname), manifest.base) || '/';

		// When build.format is 'file', request URLs may contain .html or
		// /index.html suffixes (e.g. from getUrlForPath during SSG).
		// Normalize them away so the route patterns can match.
		if (manifest.buildFormat === 'file') {
			if (strippedPathname.endsWith('/index.html')) {
				const trimmed = strippedPathname.slice(0, -'/index.html'.length);
				strippedPathname = trimmed === '' ? '/' : trimmed;
			} else if (strippedPathname.endsWith('.html')) {
				const trimmed = strippedPathname.slice(0, -'.html'.length);
				strippedPathname = trimmed === '' ? '/' : trimmed;
			}
		}

		// For domain-based i18n, prepend the resolved locale to the pathname
		const domainLocale = resolveDomainLocale(request, manifest);
		if (domainLocale) {
			strippedPathname = prependForwardSlash(
				joinPaths(normalizeTheLocale(domainLocale), strippedPathname),
			);
			if (url.pathname.endsWith('/')) {
				strippedPathname = appendForwardSlash(strippedPathname);
			}
		}

		for (const route of manifestData.routes) {
			if (route.pattern.test(strippedPathname) || (manifest.trailingSlash === 'never' && strippedPathname === '/' && route.pattern.test(''))) {
				// If the matching route is prerendered and we're not allowing
				// prerendered routes, return undefined immediately. This prevents
				// catch-all routes from handling paths that belong to prerendered
				// routes (which are served as static assets by the adapter).
				if (!allowPrerenderedRoutes && route.prerender) return undefined;
				return route;
			}
		}
		return undefined;
	};
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

function createUserMiddleware(
	deps: AstroAppDeps,
	contextFn: (c: HonoContext<any>) => Promise<APIContext>,
	options: CreateAstroAppOptions = {},
): MiddlewareHandler<AstroHonoEnv> {
	const { pipeline, manifest, logger } = deps;
	const isDev = options.isDev ?? (pipeline.runtimeMode === 'development');
	let resolvedMiddleware: Awaited<ReturnType<typeof pipeline.getMiddleware>> | undefined;

	return async (c, next) => {
		if (!resolvedMiddleware) {
			resolvedMiddleware = await pipeline.getMiddleware();
		}
		if (resolvedMiddleware === NOOP_MIDDLEWARE_FN) {
			return next();
		}

		const ctx = await contextFn(c);
		let response: Response;
		try {
		response = await callMiddleware(resolvedMiddleware, ctx, async (_apiContext, rewritePayload) => {
			if (rewritePayload) {
				// Middleware called next(rewritePayload) — resolve the rewrite target.
				const { routeData, pathname: rewritePathname, newUrl } = await pipeline.tryRewrite(rewritePayload, c.req.raw);
				// Forbid SSR → prerendered rewrites in server mode
				if (
					pipeline.manifest.serverLike === true &&
					!ctx.isPrerendered &&
					routeData.prerender === true
				) {
					throw new AstroError({
						...ForbiddenRewrite,
						message: ForbiddenRewrite.message(
							new URL(c.req.url).pathname,
							rewritePathname,
							routeData.component,
						),
						hint: ForbiddenRewrite.hint(routeData.component),
					});
				}
				const newRequest = rewritePayload instanceof Request
					? rewritePayload
					: new Request(newUrl, c.req.raw);
				copyRenderOptions(c.req.raw, newRequest);
				for (const setCookieValue of ctx.cookies.headers()) {
					newRequest.headers.append('cookie', setCookieValue.split(';')[0]);
				}
				return prepareForRender(pipeline, manifest, deps.pipeline.manifestData, logger, newRequest, routeData, {
					locals: ctx.locals,
					clientAddress: getRenderOptions(c.req.raw)?.clientAddress ?? Reflect.get(c.req.raw, clientAddressSymbol) as string | undefined,
					cookies: ctx.cookies, session: ctx.session as any,
					skipMiddleware: true,
					isDev,
				}, (renderCtx, comp) => renderCtx.render(comp));
			}
			await next();
			return c.res;
		});
		} catch (err) {
			// In dev, re-throw if there's no custom 500 page so the Vite error overlay shows.
			if (isDev) {
				const { matchRoute } = await import('../routing/match.js');
				const errorRoutePath = `/500${manifest.trailingSlash === 'always' ? '/' : ''}`;
				const custom500 = matchRoute(errorRoutePath, deps.pipeline.manifestData);
				if (!custom500) throw err;
			}
			logger.error(null, (err as any)?.stack || String(err));
			c.res = await renderErrorPage(pipeline, manifest, deps.pipeline.manifestData, logger, c.req.raw, {
				locals: ctx.locals,
				clientAddress: getRenderOptions(c.req.raw)?.clientAddress ?? Reflect.get(c.req.raw, clientAddressSymbol) as string | undefined,
				status: 500,
				error: err,
				isDev,
			});
			return c.res;
		}
		c.res = response;

		// Ensure cookies are attached and appended for responses that bypassed
		// createPagesMiddleware (e.g. rewrite responses from ctx.rewrite()).
		attachCookiesToResponse(c.res, ctx.cookies);
		const shouldAddCookies = getRenderOptions(c.req.raw)?.addCookieHeader ?? options.addCookieHeader ?? true;
		if (shouldAddCookies && !c.res.headers.has('set-cookie')) {
			for (const setCookieValue of getSetCookiesFromResponse(c.res)) {
				c.res.headers.append('set-cookie', setCookieValue);
			}
		}

		// If user middleware returned a reroutable status (404/500) with no body
		// (e.g. i18n middleware rejecting an invalid locale), render the error page.
		if (
			REROUTABLE_STATUS_CODES.includes(c.res.status) &&
			c.res.body === null &&
			c.res.headers.get(REROUTE_DIRECTIVE_HEADER) !== 'no'
		) {
			c.res = await renderErrorPage(pipeline, manifest, deps.pipeline.manifestData, logger, c.req.raw, {
				locals: ctx.locals,
				clientAddress: getRenderOptions(c.req.raw)?.clientAddress ?? Reflect.get(c.req.raw, clientAddressSymbol) as string | undefined,
				status: c.res.status as 404 | 500,
				response: c.res,
				isDev,
			});
			// Re-apply cookies to the error page response since the original response was replaced.
			if (shouldAddCookies) {
				for (const setCookieValue of ctx.cookies.headers()) {
					c.res.headers.append('set-cookie', setCookieValue);
				}
			}
		}

		return c.res;
	};
}

function createActionsMiddleware(
	deps: AstroAppDeps,
	contextFn: (c: HonoContext<any>) => Promise<APIContext>,
): MiddlewareHandler<AstroHonoEnv> {
	const { pipeline, manifest } = deps;

	return async (c, next) => {
		if (c.req.method !== 'POST') {
			return next();
		}

		const url = new URL(c.req.url);
		const pathname = removeBase(url.pathname, manifest.base);
		const ctx = await contextFn(c);

		if (pathname.startsWith('/_actions/')) {
			const actionName = decodeURIComponent(pathname.slice('/_actions/'.length));

			let baseAction: Awaited<ReturnType<typeof pipeline.getAction>>;
			try {
				baseAction = await pipeline.getAction(actionName);
			} catch {
				return next();
			}

			let input: unknown;
			try {
				input = await parseRequestBody(c.req.raw, pipeline.manifest.actionBodySizeLimit);
			} catch (e) {
				if (e instanceof TypeError) {
					return new Response(e.message, { status: 415 });
				}
				const { ActionError } = await import('../../actions/runtime/client.js');
				if (e instanceof ActionError) {
					const serialized = serializeActionResult({ data: undefined, error: e });
					if (serialized.type !== 'empty') {
						return new Response(serialized.body, {
							status: serialized.status,
							headers: { 'Content-Type': serialized.contentType },
						});
					}
				}
				throw e;
			}

			const handler = baseAction.bind(ctx);
			const result = await handler(input);
			const serialized = serializeActionResult(result);

			const response =
				serialized.type === 'empty'
					? new Response(null, { status: serialized.status })
					: new Response(serialized.body, {
							status: serialized.status,
							headers: { 'Content-Type': serialized.contentType },
						});

			if (ctx.session) {
				await (ctx.session as any)[PERSIST_SYMBOL]?.();
			}
			for (const setCookieValue of ctx.cookies.headers()) {
				response.headers.append('set-cookie', setCookieValue);
			}

			return response;
		}

		const formActionName = url.searchParams.get(ACTION_QUERY_PARAMS.actionName);
		if (formActionName && !ctx.isPrerendered) {
			const { action, setActionResult, serializeActionResult: serializeResult } = getActionContext(ctx);
			if (action?.calledFrom === 'form') {
				const actionResult = await action.handler();
				setActionResult(action.name, serializeResult(actionResult));
			}
		}

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
	contextFn: (c: HonoContext<any>) => Promise<APIContext>,
	matchRouteData: (req: Request) => RouteData | undefined,
	options: CreateAstroAppOptions = {},
): MiddlewareHandler<AstroHonoEnv> {
	const { pipeline, manifest, logger } = deps;
	const isDev = options.isDev ?? (pipeline.runtimeMode === 'development');

	const pageRenderer = new PageRenderer(pipeline, manifest, () => deps.pipeline.manifestData, logger);
	const endpointRenderer = new EndpointRenderer(pipeline, logger);
	const redirectRenderer = new RedirectRenderer(manifest);

	return async (c, _next) => {
		const state = getFetchState(c, pipeline);
		const routeData = state.routeData ?? matchRouteData(c.req.raw);
		if (!routeData) {
			const ctx = await contextFn(c);
			c.res = await renderErrorPage(pipeline, manifest, deps.pipeline.manifestData, logger, c.req.raw, {
				locals: ctx.locals,
				clientAddress: getRenderOptions(c.req.raw)?.clientAddress ?? Reflect.get(c.req.raw, clientAddressSymbol) as string | undefined,
				status: 404,
				isDev,
			});
			// Ensure ROUTE_TYPE_HEADER is set so i18n middleware can detect page responses
			if (!c.res.headers.has(ROUTE_TYPE_HEADER)) {
				c.res.headers.set(ROUTE_TYPE_HEADER, 'page');
			}
			return;
		}

		state.routeData = routeData;

		if (routeData.type === 'redirect') {
			c.res = redirectRenderer.render(c.req.raw, routeData);
			c.res.headers.set(ROUTE_TYPE_HEADER, 'redirect');
			return;
		}

		const ctx = await contextFn(c);

		if (routeData.type === 'endpoint') {
			// Wrap endpoint rendering in the cache provider if configured,
			// so that cache MISS/HIT headers and CDN headers are applied.
			if (pipeline.cacheProvider) {
				const cacheProvider = await pipeline.getCacheProvider();
				if (cacheProvider?.onRequest) {
					c.res = await cacheProvider.onRequest(
						{ request: c.req.raw, url: new URL(c.req.url) },
						async () => {
							const res = await endpointRenderer.render(routeData, ctx);
							applyCacheHeaders(ctx.cache, res);
							return res;
						},
					);
					c.res.headers.delete('CDN-Cache-Control');
					c.res.headers.delete('Cache-Tag');
				} else {
					c.res = await endpointRenderer.render(routeData, ctx);
					applyCacheHeaders(ctx.cache, c.res);
				}
			} else {
				c.res = await endpointRenderer.render(routeData, ctx);
			}
			try { c.res.headers.set(ROUTE_TYPE_HEADER, 'endpoint'); } catch { /* immutable headers */ }
			if (
				REROUTABLE_STATUS_CODES.includes(c.res.status) &&
				c.res.body === null &&
				c.res.headers.get(REROUTE_DIRECTIVE_HEADER) !== 'no'
			) {
				c.res = await renderErrorPage(pipeline, manifest, deps.pipeline.manifestData, logger, c.req.raw, {
					locals: ctx.locals,
					clientAddress: getRenderOptions(c.req.raw)?.clientAddress ?? Reflect.get(c.req.raw, clientAddressSymbol) as string | undefined,
					status: c.res.status as 404 | 500,
					isDev,
				});
			}
		} else {
			c.res = await pageRenderer.render(c.req.raw, routeData, {
				...options,
				locals: ctx.locals,
				clientAddress: getRenderOptions(c.req.raw)?.clientAddress ?? Reflect.get(c.req.raw, clientAddressSymbol) as string | undefined,
				cookies: ctx.cookies, session: ctx.session as any,
				isDev,
				skipMiddleware: true,
			});
			// PageRenderer already sets ROUTE_TYPE_HEADER via renderPage, but ensure
			// it's set for fallback/error paths too
			if (!c.res.headers.has(ROUTE_TYPE_HEADER)) {
				c.res.headers.set(ROUTE_TYPE_HEADER, routeData.type);
			}
		}

		// Persist session data to storage (e.g. fs, redis) after the request
		// completes. For pages this happens inside prepareForRender's finally
		// block, but endpoints bypass that path.
		if (ctx.session) {
			await (ctx.session as any)[PERSIST_SYMBOL]?.();
		}

		// Collect all cookies and append to the response.
		// This is the single place where cookies are added to responses.
		// Cookies come from two sources:
		// 1. ctx.cookies — set by middleware or endpoint handlers
		// 2. Response-attached AstroCookies — set by page components via Astro.cookies
		// Respect addCookieHeader option from app.render()
		const shouldAddCookies = getRenderOptions(c.req.raw)?.addCookieHeader ?? options.addCookieHeader ?? true;
		if (shouldAddCookies) {
			// Only add cookies from ctx.cookies that aren't already on the
			// response. The page/endpoint renderer may have already set
			// Set-Cookie headers; appending without checking would duplicate them.
			const existingCookies = new Set(c.res.headers.getSetCookie?.() ?? []);
			for (const setCookieValue of ctx.cookies.headers()) {
				if (!existingCookies.has(setCookieValue)) {
					c.res.headers.append('set-cookie', setCookieValue);
				}
			}
		}
	};
}

// ---------------------------------------------------------------------------
// Trailing slash middleware
// ---------------------------------------------------------------------------

function createTrailingSlashMiddleware(deps: AstroAppDeps): MiddlewareHandler<AstroHonoEnv> {
	const { manifest } = deps;
	const { trailingSlash } = manifest;

	return async (c, next) => {
		const url = new URL(c.req.url);
		const { pathname } = url;

		if (pathname === '/' || isInternalPath(pathname)) {
			return next();
		}

		// Always collapse duplicate trailing slashes, regardless of trailingSlash setting.
		const collapsed = collapseDuplicateTrailingSlashes(pathname, trailingSlash !== 'never');
		if (collapsed !== pathname) {
			const status = c.req.method === 'GET' ? 301 : 308;
			return c.redirect(collapsed + url.search, status);
		}

		if (trailingSlash === 'always' && !hasFileExtension(pathname)) {
			const withSlash = appendForwardSlash(pathname);
			if (withSlash !== pathname) {
				const status = c.req.method === 'GET' ? 301 : 308;
				return c.redirect(withSlash + url.search, status);
			}
		}

		if (trailingSlash === 'never') {
			const withoutSlash = removeTrailingForwardSlash(pathname);
			if (withoutSlash !== pathname) {
				const status = c.req.method === 'GET' ? 301 : 308;
				return c.redirect(withoutSlash + url.search, status);
			}
		}

		return next();
	};
}

// ---------------------------------------------------------------------------
// Composed astro() middleware
// ---------------------------------------------------------------------------

/**
 * Creates the fully composed Astro middleware that handles the complete
 * request lifecycle:
 * trailing slash → route resolution → redirects → user middleware → actions → rewrite → i18n → pages
 */
export function createAstroMiddleware(
	deps: AstroAppDeps,
	options: CreateAstroAppOptions = {},
): MiddlewareHandler<AstroHonoEnv> {
	const { pipeline } = deps;
	const isDev = options.isDev ?? (pipeline.runtimeMode === 'development');
	const shouldAllowPrerendered = options.allowPrerenderedRoutes ?? isDev;
	const rawMatchRouteData = createMatchRouteData(deps);
	// In dev (or during build), match prerendered routes. In production, skip them
	// (they're served as static assets by the adapter/CDN).
	const matchRouteData = (req: Request) => rawMatchRouteData(req, { allowPrerenderedRoutes: shouldAllowPrerendered });
	const contextFn = createContextFactory(deps);

	const inner = new Hono<AstroHonoEnv>();
	inner.onError((err) => { throw err; });
	inner.use(createTrailingSlashMiddleware(deps));
	// Resolve route data early so user middleware can access routePattern/isPrerendered.
	inner.use(async (c, next) => {
		const state = getFetchState(c, pipeline);
		if (!state.routeData) {
			const routeData = matchRouteData(c.req.raw);
			if (routeData) state.routeData = routeData;
		}
		return next();
	});
	inner.use(createRedirectsMiddleware(deps));
	inner.use(createUserMiddleware(deps, contextFn, options));
	inner.use(createActionsMiddleware(deps, contextFn));
	inner.use(createRewriteMiddleware(deps, matchRouteData));
	inner.use(createI18nMiddleware(deps, matchRouteData));
	inner.use(createPagesMiddleware(deps, contextFn, matchRouteData, options));

	return async (c, _next) => {
		c.res = await inner.fetch(c.req.raw);
		// Strip internally-used headers before the response reaches the client.
		// Use try/catch because some Responses (e.g. Response.redirect()) have immutable headers.
		try {
			for (const header of [REROUTE_DIRECTIVE_HEADER, ROUTE_TYPE_HEADER, NOOP_MIDDLEWARE_HEADER, REWRITE_DIRECTIVE_HEADER_KEY]) {
				c.res.headers.delete(header);
			}
		} catch {
			// Headers are immutable — create a new Response with cleaned headers
			const headers = new Headers(c.res.headers);
			for (const header of [REROUTE_DIRECTIVE_HEADER, ROUTE_TYPE_HEADER, NOOP_MIDDLEWARE_HEADER, REWRITE_DIRECTIVE_HEADER_KEY]) {
				headers.delete(header);
			}
			c.res = new Response(c.res.body, { status: c.res.status, statusText: c.res.statusText, headers });
		}
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
