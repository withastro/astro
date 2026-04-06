import { Hono } from 'hono';
import type { Context as HonoContext, MiddlewareHandler } from 'hono';

export { Hono };
import { manifest } from 'virtual:astro:manifest';
import { app } from 'virtual:astro:app';
import {
	computeCurrentLocale,
	computePreferredLocale,
	computePreferredLocaleList,
} from '../../i18n/utils.js';
import { ASTRO_GENERATOR, clientAddressSymbol, clientLocalsSymbol, pipelineSymbol } from '../constants.js';
import { PERSIST_SYMBOL } from '../session/runtime.js';
import { computeFallbackRoute } from '../../i18n/fallback.js';
import { I18nRouter, type I18nRouterContext } from '../../i18n/router.js';
import {
	ACTION_API_CONTEXT_SYMBOL,
	parseRequestBody,
	serializeActionResult,
} from '../../actions/runtime/server.js';
import type { RedirectConfig, RouteInfo } from '../../types/public/index.js';
import type { APIContext } from '../../types/public/context.js';
import type { RouteData } from '../../types/public/internal.js';
import { computeRedirectStatus, resolveRedirectTarget } from '../redirects/render.js';
import { getParams } from '../render/params-and-props.js';
import { getOriginPathname } from '../routing/rewrite.js';
import { AstroCookies } from '../cookies/index.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { AstroSession } from '../session/runtime.js';
import { AstroCache, type CacheLike } from '../cache/runtime/cache.js';
import { DisabledAstroCache, NoopAstroCache } from '../cache/runtime/noop.js';
import { Pages, type RenderOptions } from './pages.js';

const pagesApp = new Pages(manifest, app.pipeline, app);

const ASTRO_CONTEXT_KEY = 'astro.context';
export const ASTRO_ROUTE_DATA_KEY = 'astro.routeData';
export const ASTRO_REWRITE_PATHNAME_KEY = 'astro.rewritePathname';

export type AstroHonoEnv = {
	Variables: {
		[ASTRO_CONTEXT_KEY]: APIContext;
		[ASTRO_ROUTE_DATA_KEY]: RouteData | undefined;
		[ASTRO_REWRITE_PATHNAME_KEY]: string | undefined;
	};
};

/**
 * Creates (or returns a cached) Astro API context from a Hono context.
 * This gives you the same `APIContext` object that traditional Astro middleware receives:
 * locals, cookies, clientAddress, redirect, rewrite, params, i18n, session, etc.
 *
 * The context is created lazily on first call and cached for the duration of the request.
 */
export async function context(c: HonoContext<any>): Promise<APIContext> {
	const existing = c.get(ASTRO_CONTEXT_KEY);
	if (existing) return existing;

	const request = c.req.raw;
	const url = new URL(request.url);
	const pipeline = pagesApp.pipeline;
	const i18nConfig = pipeline.i18n;

	const cookies = new AstroCookies(request);

	const requestClientAddress = Reflect.get(request, clientAddressSymbol) as string | undefined;

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

	// Read locals set by integration connect middleware (via clientLocalsSymbol)
	const locals: App.Locals = (Reflect.get(request, clientLocalsSymbol) as App.Locals) ?? ({} as App.Locals);

	const ctx: APIContext = {
		get cookies() {
			return cookies;
		},
		request,
		url,
		site: pipeline.site,
		generator: ASTRO_GENERATOR,
		props: {} as any,
		params: {},
		routePattern: '',
		isPrerendered: false,
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
				pipeline.logger.warn(
					'session',
					`context.session was used but no storage configuration was provided.`,
				);
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
					pipeline.logger.warn(
						'csp',
						`context.csp was used but CSP was not configured.`,
					);
				}
				return undefined;
			}
			return undefined;
		},
		redirect(path: string, status = 302) {
			return new Response(null, {
				status,
				headers: { Location: path },
			});
		},
		async rewrite(_rewritePayload) {
			// Rewrites in app.ts are handled via the rewrite() middleware,
			// not directly on the context. This is a stub for API compatibility.
			throw new AstroError({
				...AstroErrorData.RewriteWithBodyUsed,
				message: 'Use the rewrite() middleware in app.ts instead of ctx.rewrite().',
			});
		},
		getActionResult(_action) {
			// Action results are available after form submissions via the actions() middleware.
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
}

function getRouteData(c: HonoContext<AstroHonoEnv>) {
	const fromContext = c.get(ASTRO_ROUTE_DATA_KEY);
	if (fromContext !== undefined) {
		return fromContext;
	}

	const routeData = pagesApp.match(c.req.raw);
	c.set(ASTRO_ROUTE_DATA_KEY, routeData);
	return routeData;
}

export function pages(options: RenderOptions = {}): MiddlewareHandler<AstroHonoEnv> {
	return async (c) => {
		const ctx = await context(c);
		const routeData = getRouteData(c);
		c.res = await pagesApp.render(c.req.raw, {
			addCookieHeader: options.addCookieHeader ?? true,
			locals: ctx.locals,
			clientAddress: Reflect.get(c.req.raw, clientAddressSymbol) as string | undefined,
			routeData,
			...options,
		});
	};
}

export function i18n(): MiddlewareHandler<AstroHonoEnv> {
	const i18nConfig = manifest.i18n;
	if (!i18nConfig || i18nConfig.strategy === 'manual') {
		return async (_context, next) => next();
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
						if (!acc[domain]) {
							acc[domain] = [];
						}
						acc[domain].push(locale);
						return acc;
					},
					{} as Record<string, string[]>,
				)
			: undefined,
	});

	return async (c, next) => {
		const routeData = getRouteData(c);
		const routeType = routeData?.type;

		if (routeType !== 'page' && routeType !== 'fallback') {
			return next();
		}

		const requestUrl = new URL(c.req.url);
		const currentLocale = computeCurrentLocale(
			requestUrl.pathname,
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
				if (!response) {
					return;
				}
				const notFoundRes = new Response(response.body, {
					status: 404,
					headers: response.headers,
				});
				if (routeDecision.location) {
					notFoundRes.headers.set('Location', routeDecision.location);
				}
				c.res = notFoundRes;
				return;
			}
			case 'continue':
				break;
		}

		if (!response) {
			return;
		}

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
				case 'rewrite': {
					c.set(ASTRO_REWRITE_PATHNAME_KEY, fallbackDecision.pathname + requestUrl.search);
					return;
				}
				case 'none':
					break;
			}
		}
	};
}

export function rewrite(options: RenderOptions = {}): MiddlewareHandler<AstroHonoEnv> {
	return async (c, next) => {
		await next();

		const rewritePathname = c.get(ASTRO_REWRITE_PATHNAME_KEY);
		if (!rewritePathname) {
			return;
		}

		c.set(ASTRO_REWRITE_PATHNAME_KEY, undefined);

		const ctx = await context(c);
		const rewriteUrl = new URL(rewritePathname, c.req.url);
		const rewrittenRequest = new Request(rewriteUrl, c.req.raw);
		const rewrittenRouteData = pagesApp.match(rewrittenRequest);
		c.set(ASTRO_ROUTE_DATA_KEY, rewrittenRouteData);
		c.res = await pagesApp.render(rewrittenRequest, {
			addCookieHeader: options.addCookieHeader ?? true,
			locals: ctx.locals,
			clientAddress: Reflect.get(c.req.raw, clientAddressSymbol) as string | undefined,
			routeData: rewrittenRouteData,
			...options,
		});
	};
}

export function redirects(
	config?: Record<string, RedirectConfig>,
): MiddlewareHandler<AstroHonoEnv> {
	// If no config provided, use redirect routes from the manifest
	const redirectRoutes: RouteData[] = config
		? []
		: manifest.routes
				.map((r: RouteInfo) => r.routeData)
				.filter((r: RouteData) => r.type === 'redirect');

	return async (c, next) => {
		const url = new URL(c.req.url);
		const pathname = url.pathname;

		if (config) {
			for (const [from, to] of Object.entries(config)) {
				const pattern = new RegExp(
					`^${from.replace(/\[[^\]]+\]/g, '(?:[^/]+)').replace(/\[\.\.\.[^\]]+\]/g, '(?:.*)')}$`,
				);
				const match = pattern.exec(pathname);
				if (match) {
					const status =
						typeof to === 'object' ? to.status : c.req.method === 'GET' ? 301 : 308;
					const destination = typeof to === 'object' ? to.destination : to;
					return c.redirect(destination, status);
				}
			}
		} else {
			for (const routeData of redirectRoutes) {
				if (routeData.pattern.test(pathname)) {
					const params = getParams(routeData, pathname);
					const status = computeRedirectStatus(
						c.req.method,
						routeData.redirect,
						routeData.redirectRoute,
					);
					const location = resolveRedirectTarget(
						params,
						routeData.redirect,
						routeData.redirectRoute,
						manifest.trailingSlash,
					);
					return new Response(null, { status, headers: { location } });
				}
			}
		}

		return next();
	};
}

export function actions(): MiddlewareHandler<AstroHonoEnv> {
	return async (c, next) => {
		const url = new URL(c.req.url);

		if (c.req.method !== 'POST') {
			return next();
		}

		// Only handle RPC calls to /_actions/{name}
		// Form submissions (with ?_action=) fall through to pages() middleware
		// where RenderContext handles them via the standard flow
		if (!url.pathname.startsWith('/_actions/')) {
			return next();
		}

		const actionName = decodeURIComponent(url.pathname.slice('/_actions/'.length));

		const pipeline = pagesApp.pipeline;

		let baseAction: Awaited<ReturnType<typeof pipeline.getAction>>;
		try {
			baseAction = await pipeline.getAction(actionName);
		} catch {
			return next();
		}

		const ctx = await context(c);

		let input: unknown;
		try {
			input = await parseRequestBody(c.req.raw, pipeline.manifest.actionBodySizeLimit);
		} catch (e) {
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

		// Persist the session and add any cookies set during the action
		if (ctx.session) {
			await (ctx.session as any)[PERSIST_SYMBOL]?.();
		}
		for (const setCookieValue of ctx.cookies.headers()) {
			response.headers.append('set-cookie', setCookieValue);
		}

		return response;
	};
}

export function astro(options: RenderOptions = {}): MiddlewareHandler<AstroHonoEnv> {
	const redirectsMiddleware = redirects();
	const actionsMiddleware = actions();
	const rewriteMiddleware = rewrite(options);
	const i18nMiddleware = i18n();
	const renderMiddleware = pages(options);

	return async (c, next) => {
		const outerRes = await redirectsMiddleware(c, async () => {
			const innerRes = await actionsMiddleware(c, async () => {
				await rewriteMiddleware(c, async () => {
					await i18nMiddleware(c, async () => {
						await renderMiddleware(c, next);
					});
				});
			});
			if (innerRes instanceof Response) c.res = innerRes;
		});
		if (outerRes instanceof Response) c.res = outerRes;
		return c.res;
	};
}
