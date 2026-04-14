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
	collapseDuplicateSlashes,
	collapseDuplicateTrailingSlashes,
	hasFileExtension,
	isInternalPath,
	joinPaths,
	prependForwardSlash,
	removeBase,
	removeTrailingForwardSlash,
} from '@astrojs/internal-helpers/path';
import { normalizeTheLocale } from '../../i18n/index.js';
import {
	computeCurrentLocale,
	computePreferredLocale,
	computePreferredLocaleList,
} from '../../i18n/utils.js';
import { ASTRO_GENERATOR, clientAddressSymbol, clientLocalsSymbol, NOOP_MIDDLEWARE_HEADER, pipelineSymbol, REROUTABLE_STATUS_CODES, REROUTE_DIRECTIVE_HEADER, REWRITE_DIRECTIVE_HEADER_KEY, ROUTE_TYPE_HEADER } from '../constants.js';
import { PERSIST_SYMBOL } from '../session/runtime.js';
import { renderOptionsStore } from './render-options-store.js';
import { computeFallbackRoute } from '../../i18n/fallback.js';
import { ForbiddenRewrite } from '../errors/errors-data.js';
import { I18nRouter, type I18nRouterContext } from '../../i18n/router.js';
import {
	ACTION_API_CONTEXT_SYMBOL,
	getActionContext,
	parseRequestBody,
	serializeActionResult,
} from '../../actions/runtime/server.js';
import { ACTION_QUERY_PARAMS } from '../../actions/consts.js';
import { callMiddleware } from '../middleware/callMiddleware.js';
import { NOOP_MIDDLEWARE_FN } from '../middleware/noop-middleware.js';
import type { RouteInfo, SSRManifest } from '../../types/public/index.js';
import type { APIContext } from '../../types/public/context.js';
import type { RouteData } from '../../types/public/internal.js';
import { computeRedirectStatus, resolveRedirectTarget } from '../redirects/render.js';
import { getParams } from '../render/params-and-props.js';
import { getOriginPathname } from '../routing/rewrite.js';
import { validateAndDecodePathname } from '../util/pathname.js';
import { AstroCookies } from '../cookies/index.js';
import { attachCookiesToResponse, getSetCookiesFromResponse } from '../cookies/response.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { AstroSession } from '../session/runtime.js';
import { AstroCache, type CacheLike, applyCacheHeaders } from '../cache/runtime/cache.js';
import { DisabledAstroCache, NoopAstroCache } from '../cache/runtime/noop.js';
import { PageRenderer } from './renderers/page.js';
import { EndpointRenderer } from './renderers/endpoint.js';
import { RedirectRenderer } from './renderers/redirect.js';
import { prepareForRender, renderErrorPage, type PrepareOptions } from './prepare.js';
import type { Pipeline } from '../base-pipeline.js';
import type { AstroLogger } from '../logger/core.js';
import type { RoutesList } from '../../types/astro.js';

export { Hono };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AstroAppDeps {
	pipeline: Pipeline;
	manifest: SSRManifest;
	manifestData: RoutesList;
	logger: AstroLogger;
}

/**
 * Symbol used to store mutable deps on the Hono app instance.
 * This allows createAstroServerApp to update the deps (e.g. manifestData)
 * on the cached Hono app before each request.
 */
const ASTRO_APP_DEPS = Symbol.for('astro.appDeps');

const ASTRO_CONTEXT_KEY = 'astro.context';
export const ASTRO_ROUTE_DATA_KEY = 'astro.routeData';
export const ASTRO_REWRITE_PATHNAME_KEY = 'astro.rewritePathname';
const ASTRO_REWRITE_COUNT_KEY = 'astro.rewriteCount';


export type AstroHonoEnv = {
	Variables: {
		[ASTRO_CONTEXT_KEY]: APIContext;
		[ASTRO_ROUTE_DATA_KEY]: RouteData | undefined;
		[ASTRO_REWRITE_PATHNAME_KEY]: string | undefined;
		[ASTRO_REWRITE_COUNT_KEY]: number;
	};
};

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
		const manifest = deps.manifest;
		const manifestData = deps.manifestData;
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
			if (!allowPrerenderedRoutes && route.prerender) continue;
			if (route.pattern.test(strippedPathname)) return route;
			if (manifest.trailingSlash === 'never' && strippedPathname === '/' && route.pattern.test('')) {
				return route;
			}
		}
		return undefined;
	};
}

// ---------------------------------------------------------------------------
// Context factory
// ---------------------------------------------------------------------------

function createContextFactory(deps: AstroAppDeps, _matchRouteData: (req: Request) => RouteData | undefined) {
	const { pipeline, manifest, logger } = deps;

	return async function context(c: HonoContext<any>): Promise<APIContext> {
		const existing = c.get(ASTRO_CONTEXT_KEY);
		if (existing) return existing;

		const request = c.req.raw;
		const url = new URL(request.url);

		// Normalize the URL pathname to prevent security bypass attacks.
		// Decodes multi-level encoding and collapses duplicate slashes so that
		// middleware sees the canonical path (e.g. //admin → /admin).
		try {
			url.pathname = validateAndDecodePathname(url.pathname);
		} catch {
			try {
				url.pathname = decodeURI(url.pathname);
			} catch {
				// If even basic decoding fails, leave pathname as-is.
			}
		}
		url.pathname = collapseDuplicateSlashes(url.pathname);

		const i18nConfig = pipeline.i18n;

		const cookies = new AstroCookies(request);
		const storeOptions = renderOptionsStore.getStore();
		const requestClientAddress = storeOptions?.clientAddress ?? Reflect.get(request, clientAddressSymbol) as string | undefined;

		const pipelineSessionDriver = await pipeline.getSessionDriver();
		const session =
			pipeline.manifest.sessionConfig && pipelineSessionDriver
				? new AstroSession({
						cookies,
						config: pipeline.manifest.sessionConfig,
						runtimeMode: pipeline.runtimeMode,
						driverFactory: pipelineSessionDriver,
						mockStorage: null,
					})
				: undefined;

		let cache: CacheLike;
		if (!pipeline.cacheConfig) {
			cache = new DisabledAstroCache(pipeline.logger);
		} else if (pipeline.runtimeMode === 'development') {
			cache = new NoopAstroCache();
		} else {
			const cacheProvider = await pipeline.getCacheProvider();
			cache = new AstroCache(cacheProvider);
		}

		const locals: App.Locals = storeOptions?.locals ?? (Reflect.get(request, clientLocalsSymbol) as App.Locals) ?? ({} as App.Locals);
		let _paramsOverride: Record<string, string | undefined> | undefined;
		let _routePatternOverride: string | undefined;

		const ctx: APIContext = {
			get cookies() {
				return cookies;
			},
			request,
			url,
			site: pipeline.site,
			generator: ASTRO_GENERATOR,
			props: {} as any,
			get params() {
				if (_paramsOverride) return _paramsOverride;
				const routeData = c.get(ASTRO_ROUTE_DATA_KEY);
				if (!routeData) return {};
				// decodeURI so params with special characters (e.g. spaces)
				// are returned decoded, matching getStaticPaths values.
				const pathname = removeBase(decodeURI(url.pathname), manifest.base) || '/';
				return getParams(routeData, pathname);
			},
			set params(value) {
				_paramsOverride = value;
			},
			get routePattern() {
				return _routePatternOverride ?? c.get(ASTRO_ROUTE_DATA_KEY)?.route ?? '';
			},
			set routePattern(value) {
				_routePatternOverride = value;
			},
			get isPrerendered() {
				return c.get(ASTRO_ROUTE_DATA_KEY)?.prerender ?? false;
			},
			locals,
			get clientAddress() {
				if (requestClientAddress) return requestClientAddress;
				if (pipeline.adapterName) {
					throw new AstroError({
						...AstroErrorData.ClientAddressNotAvailable,
						message: AstroErrorData.ClientAddressNotAvailable.message(pipeline.adapterName),
					});
				}
				throw new AstroError(AstroErrorData.StaticClientAddressNotAvailable);
			},
			get currentLocale() {
				if (!i18nConfig) return undefined;
				// For domain-based i18n, resolve locale from domain first
				const domainLocale = resolveDomainLocale(request, manifest);
				if (domainLocale) return domainLocale;
				return computeCurrentLocale(url.pathname, i18nConfig.locales, i18nConfig.defaultLocale);
			},
			get preferredLocale() {
				if (!i18nConfig) return undefined;
				return computePreferredLocale(request, i18nConfig.locales);
			},
			get preferredLocaleList() {
				if (!i18nConfig) return undefined;
				return computePreferredLocaleList(request, i18nConfig.locales);
			},
			get originPathname() {
				return getOriginPathname(request);
			},
			get session() {
				if (!session) {
					pipeline.logger.warn('session', `context.session was used but no storage configuration was provided.`);
					return undefined;
				}
				return session;
			},
			get cache() {
				return cache;
			},
			get csp() {
				if (!pipeline.manifest.csp) {
					if (pipeline.runtimeMode === 'production') {
						pipeline.logger.warn('csp', `context.csp was used but CSP was not configured.`);
					}
					return undefined;
				}
				return undefined;
			},
			redirect(path: string, status = 302) {
				return new Response(null, { status, headers: { Location: path } });
			},
			async rewrite(rewritePayload) {
				const { routeData, pathname: rewritePathname, newUrl } = await pipeline.tryRewrite(rewritePayload, request);
				// Forbid SSR → prerendered rewrites in server mode
				const sourceRouteData = c.get(ASTRO_ROUTE_DATA_KEY);
				if (
					pipeline.manifest.serverLike === true &&
					sourceRouteData && !sourceRouteData.prerender &&
					routeData.prerender === true
				) {
					throw new AstroError({
						...ForbiddenRewrite,
						message: ForbiddenRewrite.message(url.pathname, rewritePathname, routeData.component),
						hint: ForbiddenRewrite.hint(routeData.component),
					});
				}
				const newRequest = rewritePayload instanceof Request
					? rewritePayload
					: new Request(newUrl, request);
				for (const setCookieValue of cookies.headers()) {
					newRequest.headers.append('cookie', setCookieValue.split(';')[0]);
				}
				return prepareForRender(pipeline, manifest, deps.manifestData, logger, newRequest, routeData, {
					locals,
					clientAddress: storeOptions?.clientAddress ?? Reflect.get(request, clientAddressSymbol) as string | undefined,
					cookies,
					session,
				}, (renderContext, componentInstance) => renderContext.render(componentInstance));
			},
			getActionResult(_action) {
				return undefined;
			},
			async callAction(action, input) {
				const handler = (action as any).bind(ctx);
				return handler(input);
			},
		};

		Reflect.set(ctx, pipelineSymbol, pipeline);
		Reflect.set(ctx, ACTION_API_CONTEXT_SYMBOL, true);
		c.set(ASTRO_CONTEXT_KEY, ctx);
		return ctx;
	};
}

// ---------------------------------------------------------------------------
// Middleware factories
// ---------------------------------------------------------------------------

function createRedirectsMiddleware(deps: AstroAppDeps): MiddlewareHandler<AstroHonoEnv> {
	const { manifest } = deps;
	const redirectRoutes: RouteData[] = manifest.routes
		.map((r: RouteInfo) => r.routeData)
		.filter((r: RouteData) => r.type === 'redirect');

	if (redirectRoutes.length === 0) {
		return async (_c, next) => next();
	}

	return async (c, next) => {
		const url = new URL(c.req.url);
		const pathname = removeBase(decodeURI(url.pathname), manifest.base);

		for (const routeData of redirectRoutes) {
			if (routeData.pattern.test(pathname)) {
				const params = getParams(routeData, pathname);
				const status = computeRedirectStatus(c.req.method, routeData.redirect, routeData.redirectRoute);
				const location = resolveRedirectTarget(params, routeData.redirect, routeData.redirectRoute, manifest.trailingSlash);
				return new Response(null, { status, headers: { location } });
			}
		}

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
				for (const setCookieValue of ctx.cookies.headers()) {
					newRequest.headers.append('cookie', setCookieValue.split(';')[0]);
				}
				return prepareForRender(pipeline, manifest, deps.manifestData, logger, newRequest, routeData, {
					locals: ctx.locals,
					clientAddress: renderOptionsStore.getStore()?.clientAddress ?? Reflect.get(c.req.raw, clientAddressSymbol) as string | undefined,
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
				const custom500 = matchRoute(errorRoutePath, deps.manifestData);
				if (!custom500) throw err;
			}
			logger.error(null, (err as any)?.stack || String(err));
			c.res = await renderErrorPage(pipeline, manifest, deps.manifestData, logger, c.req.raw, {
				locals: ctx.locals,
				clientAddress: renderOptionsStore.getStore()?.clientAddress ?? Reflect.get(c.req.raw, clientAddressSymbol) as string | undefined,
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
		const shouldAddCookies = renderOptionsStore.getStore()?.addCookieHeader ?? options.addCookieHeader ?? true;
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
			c.res = await renderErrorPage(pipeline, manifest, deps.manifestData, logger, c.req.raw, {
				locals: ctx.locals,
				clientAddress: renderOptionsStore.getStore()?.clientAddress ?? Reflect.get(c.req.raw, clientAddressSymbol) as string | undefined,
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
	contextFn: (c: HonoContext<any>) => Promise<APIContext>,
	matchRouteData: (req: Request) => RouteData | undefined,
): MiddlewareHandler<AstroHonoEnv> {
	const { pipeline, manifest, logger } = deps;

	return async (c, next) => {
		await next();

		const rewritePathname = c.get(ASTRO_REWRITE_PATHNAME_KEY);
		if (!rewritePathname) return;

		c.set(ASTRO_REWRITE_PATHNAME_KEY, undefined);
		const rewriteCount = ((c as any).get(ASTRO_REWRITE_COUNT_KEY) ?? 0) + 1;
		(c as any).set(ASTRO_REWRITE_COUNT_KEY, rewriteCount);
		if (rewriteCount >= 4) {
			c.res = new Response('Loop Detected', {
				status: 508,
				statusText: 'Astro detected a loop where you tried to call the rewriting logic more than four times.',
			});
			return;
		}

		const ctx = await contextFn(c);
		const rewriteUrl = new URL(rewritePathname, c.req.url);
		const rewrittenRequest = new Request(rewriteUrl, c.req.raw);
		const rewrittenRouteData = matchRouteData(rewrittenRequest);
		c.set(ASTRO_ROUTE_DATA_KEY, rewrittenRouteData);
		if (rewrittenRouteData) {
			c.res = await prepareForRender(pipeline, manifest, deps.manifestData, logger, rewrittenRequest, rewrittenRouteData, {
				locals: ctx.locals,
				cookies: ctx.cookies, session: ctx.session as any,
				clientAddress: renderOptionsStore.getStore()?.clientAddress ?? Reflect.get(c.req.raw, clientAddressSymbol) as string | undefined,
			}, (renderContext, componentInstance) => renderContext.render(componentInstance));
		} else {
			c.res = await renderErrorPage(pipeline, manifest, deps.manifestData, logger, rewrittenRequest, {
				locals: ctx.locals,
				clientAddress: renderOptionsStore.getStore()?.clientAddress ?? Reflect.get(c.req.raw, clientAddressSymbol) as string | undefined,
				status: 404,
				isDev: pipeline.runtimeMode === 'development',
			});
		}
	};
}

function createI18nMiddleware(
	deps: AstroAppDeps,
	matchRouteData: (req: Request) => RouteData | undefined,
): MiddlewareHandler<AstroHonoEnv> {
	const { manifest } = deps;
	const i18nConfig = manifest.i18n;
	if (!i18nConfig || i18nConfig.strategy === 'manual') {
		return async (_c, next) => next();
	}

	const i18nRouter = new I18nRouter({
		strategy: i18nConfig.strategy,
		defaultLocale: i18nConfig.defaultLocale,
		locales: i18nConfig.locales,
		base: manifest.base,
		domains: i18nConfig.domainLookupTable
			? Object.keys(i18nConfig.domainLookupTable).reduce(
					(acc, domain) => {
						const locale = i18nConfig.domainLookupTable[domain];
						if (!acc[domain]) acc[domain] = [];
						acc[domain].push(locale);
						return acc;
					},
					{} as Record<string, string[]>,
				)
			: undefined,
	});

	function getRouteData(c: HonoContext<AstroHonoEnv>) {
		const fromContext = c.get(ASTRO_ROUTE_DATA_KEY);
		if (fromContext !== undefined) return fromContext;
		const routeData = matchRouteData(c.req.raw);
		c.set(ASTRO_ROUTE_DATA_KEY, routeData);
		return routeData;
	}

	return async (c, next) => {
		const routeData = getRouteData(c);
		const routeType = routeData?.type;

		if (routeType !== 'page' && routeType !== 'fallback') {
			return next();
		}

		const requestUrl = new URL(c.req.url);
		const currentLocale = computeCurrentLocale(
			removeBase(requestUrl.pathname, manifest.base),
			i18nConfig.locales,
			i18nConfig.defaultLocale,
		);

		await next();
		let response = c.res;

		const routerContext: I18nRouterContext = {
			currentLocale,
			currentDomain: requestUrl.hostname,
			routeType,
			isReroute: false,
		};

		const routeDecision = i18nRouter.match(requestUrl.pathname, routerContext);
		switch (routeDecision.type) {
			case 'redirect':
				c.res = c.redirect(routeDecision.location, routeDecision.status);
				return;
			case 'notFound': {
				if (!response) return;
				const notFoundRes = new Response(response.body, { status: 404, headers: response.headers });
				if (routeDecision.location) notFoundRes.headers.set('Location', routeDecision.location);
				c.res = notFoundRes;
				return;
			}
			case 'continue':
				break;
		}

		if (!response) return;

		if (i18nConfig.fallback && i18nConfig.fallbackType) {
			const fallbackDecision = computeFallbackRoute({
				pathname: requestUrl.pathname,
				responseStatus: response.status,
				currentLocale,
				fallback: i18nConfig.fallback,
				fallbackType: i18nConfig.fallbackType,
				locales: i18nConfig.locales,
				defaultLocale: i18nConfig.defaultLocale,
				strategy: i18nConfig.strategy,
				base: manifest.base,
			});

			switch (fallbackDecision.type) {
				case 'redirect':
					c.res = c.redirect(fallbackDecision.pathname + requestUrl.search);
					return;
				case 'rewrite':
					c.set(ASTRO_REWRITE_PATHNAME_KEY, fallbackDecision.pathname + requestUrl.search);
					return;
				case 'none':
					break;
			}
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

	const pageRenderer = new PageRenderer(pipeline, manifest, () => deps.manifestData, logger);
	const endpointRenderer = new EndpointRenderer(pipeline, logger);
	const redirectRenderer = new RedirectRenderer(manifest);

	return async (c, _next) => {
		const routeData = c.get(ASTRO_ROUTE_DATA_KEY) ?? matchRouteData(c.req.raw);
		if (!routeData) {
			const ctx = await contextFn(c);
			c.res = await renderErrorPage(pipeline, manifest, deps.manifestData, logger, c.req.raw, {
				locals: ctx.locals,
				clientAddress: renderOptionsStore.getStore()?.clientAddress ?? Reflect.get(c.req.raw, clientAddressSymbol) as string | undefined,
				status: 404,
				isDev,
			});
			// Ensure ROUTE_TYPE_HEADER is set so i18n middleware can detect page responses
			if (!c.res.headers.has(ROUTE_TYPE_HEADER)) {
				c.res.headers.set(ROUTE_TYPE_HEADER, 'page');
			}
			return;
		}

		c.set(ASTRO_ROUTE_DATA_KEY, routeData);

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
				c.res = await renderErrorPage(pipeline, manifest, deps.manifestData, logger, c.req.raw, {
					locals: ctx.locals,
					clientAddress: renderOptionsStore.getStore()?.clientAddress ?? Reflect.get(c.req.raw, clientAddressSymbol) as string | undefined,
					status: c.res.status as 404 | 500,
					isDev,
				});
			}
		} else {
			c.res = await pageRenderer.render(c.req.raw, routeData, {
				...options,
				locals: ctx.locals,
				clientAddress: renderOptionsStore.getStore()?.clientAddress ?? Reflect.get(c.req.raw, clientAddressSymbol) as string | undefined,
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

		// Collect all cookies and append to the response.
		// This is the single place where cookies are added to responses.
		// Cookies come from two sources:
		// 1. ctx.cookies — set by middleware or endpoint handlers
		// 2. Response-attached AstroCookies — set by page components via Astro.cookies
		// Respect addCookieHeader option from app.render()
		const shouldAddCookies = renderOptionsStore.getStore()?.addCookieHeader ?? options.addCookieHeader ?? true;
		if (shouldAddCookies) {
			for (const setCookieValue of ctx.cookies.headers()) {
				c.res.headers.append('set-cookie', setCookieValue);
			}
			for (const setCookieValue of getSetCookiesFromResponse(c.res)) {
				c.res.headers.append('set-cookie', setCookieValue);
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
	const isDev = options.isDev ?? (deps.pipeline.runtimeMode === 'development');
	const shouldAllowPrerendered = options.allowPrerenderedRoutes ?? isDev;
	const rawMatchRouteData = createMatchRouteData(deps);
	// In dev (or during build), match prerendered routes. In production, skip them
	// (they're served as static assets by the adapter/CDN).
	const matchRouteData = (req: Request) => rawMatchRouteData(req, { allowPrerenderedRoutes: shouldAllowPrerendered });
	const contextFn = createContextFactory(deps, matchRouteData);

	const inner = new Hono<AstroHonoEnv>();
	inner.onError((err) => { throw err; });
	inner.use(createTrailingSlashMiddleware(deps));
	// Resolve route data early so user middleware can access routePattern/isPrerendered.
	inner.use(async (c, next) => {
		if (!c.get(ASTRO_ROUTE_DATA_KEY)) {
			const routeData = matchRouteData(c.req.raw);
			if (routeData) c.set(ASTRO_ROUTE_DATA_KEY, routeData);
		}
		return next();
	});
	inner.use(createRedirectsMiddleware(deps));
	inner.use(createUserMiddleware(deps, contextFn, options));
	inner.use(createActionsMiddleware(deps, contextFn));
	inner.use(createRewriteMiddleware(deps, contextFn, matchRouteData));
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
