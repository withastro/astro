import type { MiddlewareHandler } from 'hono';
import { manifest } from 'virtual:astro:manifest';
import { computeCurrentLocale } from '../../i18n/utils.js';
import { clientAddressSymbol } from '../constants.js';
import { computeFallbackRoute } from '../../i18n/fallback.js';
import { I18nRouter, type I18nRouterContext } from '../../i18n/router.js';
import { ACTION_RPC_ROUTE_PATTERN } from '../../actions/consts.js';
import { parseRequestBody, serializeActionResult } from '../../actions/runtime/server.js';
import type { RedirectConfig, RouteInfo } from '../../types/public/index.js';
import type { RouteData } from '../../types/public/internal.js';
import { computeRedirectStatus, resolveRedirectTarget } from '../redirects/render.js';
import { getParams } from '../render/params-and-props.js';
import { getAPIContext } from './api-context.js';
import { Pages, type RenderOptions } from './pages.js';

const pagesApp = new Pages(manifest);

export const ASTRO_LOCALS_KEY = 'astro.locals';
export const ASTRO_CLIENT_ADDRESS_KEY = 'astro.clientAddress';
export const ASTRO_ROUTE_DATA_KEY = 'astro.routeData';
export const ASTRO_REWRITE_PATHNAME_KEY = 'astro.rewritePathname';

export type AstroHonoEnv = {
	Variables: {
		[ASTRO_LOCALS_KEY]: object;
		[ASTRO_CLIENT_ADDRESS_KEY]: string | undefined;
		[ASTRO_ROUTE_DATA_KEY]: RouteData | undefined;
		[ASTRO_REWRITE_PATHNAME_KEY]: string | undefined;
	};
};

export function context(): MiddlewareHandler<AstroHonoEnv> {
	return async (context, next) => {
		const locals = context.get(ASTRO_LOCALS_KEY);
		if (!locals) {
			context.set(ASTRO_LOCALS_KEY, {});
		}

		const clientAddress = context.get(ASTRO_CLIENT_ADDRESS_KEY);
		if (clientAddress === undefined) {
			const requestClientAddress = Reflect.get(context.req.raw, clientAddressSymbol) as
				| string
				| undefined;
			if (requestClientAddress !== undefined) {
				context.set(ASTRO_CLIENT_ADDRESS_KEY, requestClientAddress);
			}
		}

		await next();
	};
}

function getRouteData(context: Parameters<MiddlewareHandler<AstroHonoEnv>>[0]) {
	const fromContext = context.get(ASTRO_ROUTE_DATA_KEY);
	if (fromContext !== undefined) {
		return fromContext;
	}

	const routeData = pagesApp.match(context.req.raw);
	context.set(ASTRO_ROUTE_DATA_KEY, routeData);
	return routeData;
}

function getRenderOptions(
	context: Parameters<MiddlewareHandler<AstroHonoEnv>>[0],
	options: RenderOptions,
): RenderOptions {
	const locals = context.get(ASTRO_LOCALS_KEY) ?? options.locals ?? {};
	const clientAddress =
		context.get(ASTRO_CLIENT_ADDRESS_KEY) ??
		options.clientAddress ??
		(Reflect.get(context.req.raw, clientAddressSymbol) as string | undefined);

	if (!context.get(ASTRO_LOCALS_KEY)) {
		context.set(ASTRO_LOCALS_KEY, locals);
	}

	return {
		...options,
		addCookieHeader: options.addCookieHeader ?? true,
		locals,
		clientAddress,
	};
}

export function pages(options: RenderOptions = {}): MiddlewareHandler<AstroHonoEnv> {
	return async (context) => {
		const routeData = getRouteData(context);
		context.res = await pagesApp.render(context.req.raw, {
			...getRenderOptions(context, options),
			routeData,
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

	return async (context, next) => {
		const routeData = getRouteData(context);
		const routeType = routeData?.type;

		if (routeType !== 'page' && routeType !== 'fallback') {
			return next();
		}

		const requestUrl = new URL(context.req.url);
		const currentLocale = computeCurrentLocale(
			requestUrl.pathname,
			i18nConfig.locales,
			i18nConfig.defaultLocale,
		);

		await next();
		let response = context.res;

		const routerContext: I18nRouterContext = {
			currentLocale,
			currentDomain: requestUrl.hostname,
			routeType,
			isReroute: false,
		};

		const routeDecision = i18nRouter.match(requestUrl.pathname, routerContext);
		switch (routeDecision.type) {
			case 'redirect':
				context.res = context.redirect(routeDecision.location, routeDecision.status);
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
				context.res = notFoundRes;
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
					context.res = context.redirect(fallbackDecision.pathname + requestUrl.search);
					return;
				case 'rewrite': {
					context.set(ASTRO_REWRITE_PATHNAME_KEY, fallbackDecision.pathname + requestUrl.search);
					return;
				}
				case 'none':
					break;
			}
		}
	};
}

export function rewrite(options: RenderOptions = {}): MiddlewareHandler<AstroHonoEnv> {
	return async (context, next) => {
		await next();

		const rewritePathname = context.get(ASTRO_REWRITE_PATHNAME_KEY);
		if (!rewritePathname) {
			return;
		}

		context.set(ASTRO_REWRITE_PATHNAME_KEY, undefined);

		const rewriteUrl = new URL(rewritePathname, context.req.url);

		const rewrittenRequest = new Request(rewriteUrl, context.req.raw);
		const rewrittenRouteData = pagesApp.match(rewrittenRequest);
		context.set(ASTRO_ROUTE_DATA_KEY, rewrittenRouteData);
		context.res = await pagesApp.render(rewrittenRequest, {
			...getRenderOptions(context, options),
			routeData: rewrittenRouteData,
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

	return async (context, next) => {
		const url = new URL(context.req.url);
		const pathname = url.pathname;

		if (config) {
			// User-provided redirects: match against the provided map
			for (const [from, to] of Object.entries(config)) {
				// Simple string match for static routes, or regex for dynamic ones
				const pattern = new RegExp(
					`^${from.replace(/\[([^\]]+)\]/g, '([^/]+)').replace(/\[\.\.\.([^\]]+)\]/g, '(.*)')}$`,
				);
				const match = pattern.exec(pathname);
				if (match) {
					const status =
						typeof to === 'object' ? to.status : context.req.method === 'GET' ? 301 : 308;
					const destination = typeof to === 'object' ? to.destination : to;
					return context.redirect(destination, status);
				}
			}
		} else {
			// Manifest-based redirects: use RouteData for proper param extraction
			for (const routeData of redirectRoutes) {
				if (routeData.pattern.test(pathname)) {
					const params = getParams(routeData, pathname);
					const status = computeRedirectStatus(
						context.req.method,
						routeData.redirect,
						routeData.redirectRoute,
					);
					const location = resolveRedirectTarget(
						params,
						routeData.redirect,
						routeData.redirectRoute,
						manifest.trailingSlash,
					);
					return new Response(null, { status, headers: { location: encodeURI(location) } });
				}
			}
		}

		return next();
	};
}

export function actions(): MiddlewareHandler<AstroHonoEnv> {
	return async (context, next) => {
		const url = new URL(context.req.url);

		if (context.req.method !== 'POST' || !url.pathname.startsWith('/_actions/')) {
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

		const apiContext = await getAPIContext(context.req.raw, pipeline, {
			locals: context.get(ASTRO_LOCALS_KEY),
			clientAddress: context.get(ASTRO_CLIENT_ADDRESS_KEY),
			routePattern: ACTION_RPC_ROUTE_PATTERN,
		});

		let input: unknown;
		try {
			input = await parseRequestBody(context.req.raw, pipeline.manifest.actionBodySizeLimit);
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

		const handler = baseAction.bind(apiContext);
		const result = await handler(input);
		const serialized = serializeActionResult(result);

		if (serialized.type === 'empty') {
			return new Response(null, { status: serialized.status });
		}
		return new Response(serialized.body, {
			status: serialized.status,
			headers: { 'Content-Type': serialized.contentType },
		});
	};
}

export function astro(options: RenderOptions = {}): MiddlewareHandler<AstroHonoEnv> {
	const contextMiddleware = context();
	const redirectsMiddleware = redirects();
	const actionsMiddleware = actions();
	const rewriteMiddleware = rewrite(options);
	const i18nMiddleware = i18n();
	const renderMiddleware = pages(options);

	return async (context, next) => {
		await contextMiddleware(context, async () => {
			await redirectsMiddleware(context, async () => {
				await actionsMiddleware(context, async () => {
					await rewriteMiddleware(context, async () => {
						await i18nMiddleware(context, async () => {
							await renderMiddleware(context, next);
						});
					});
				});
			});
		});
		return context.res;
	};
}
