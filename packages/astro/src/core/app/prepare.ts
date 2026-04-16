import {
	prependForwardSlash,
	removeBase,
	removeTrailingForwardSlash,
} from '@astrojs/internal-helpers/path';
import type { ComponentInstance } from '../../types/astro.js';
import type { RouteData } from '../../types/public/internal.js';
import type { SSRManifest } from '../../types/public/index.js';
import {
	REROUTABLE_STATUS_CODES,
	REROUTE_DIRECTIVE_HEADER,
	responseSentSymbol,
	ROUTE_TYPE_HEADER,
} from '../constants.js';
import { isAstroError } from '../errors/index.js';
import { NoMatchingStaticPathFound } from '../errors/errors-data.js';
import { type CreateRenderContext, RenderContext } from '../render-context.js';
import { matchRoute } from '../routing/match.js';
import { routeHasHtmlExtension } from '../routing/helpers.js';
import { type CacheLike, applyCacheHeaders } from '../cache/runtime/cache.js';
import { type AstroSession, PERSIST_SYMBOL } from '../session/runtime.js';
import { attachCookiesToResponse, getCookiesFromResponse } from '../cookies/response.js';
import { AstroCookies } from '../cookies/index.js';
import type { Pipeline } from '../base-pipeline.js';
import type { AstroLogger } from '../logger/core.js';
import type { RoutesList } from '../../types/astro.js';
import { createSSRResult } from './ssr-result.js';
import { renderPage } from '../../runtime/server/render/page.js';
import { getParams } from '../render/index.js';
import { setOriginPathname } from '../routing/rewrite.js';
import { originPathnameSymbol } from '../constants.js';
import { getRenderOptions } from './render-options-store.js';

export interface PrepareOptions {
	/** Client IP address for Astro.clientAddress. */
	clientAddress?: string | undefined;
	/** Astro.locals object. */
	locals?: object | undefined;
	/** Skip user middleware in RenderContext. */
	skipMiddleware?: boolean;
	/** Shared AstroCookies instance from the Hono APIContext. */
	cookies?: AstroCookies;
	/** Shared AstroSession instance from the Hono APIContext. */
	session?: AstroSession;
	/** Fetch function for prerendered error pages in production. */
	prerenderedErrorPageFetch?: (url: string) => Promise<Response>;
	/** Whether the app is running in dev mode. */
	isDev?: boolean;
}

/**
 * Shared render orchestration for both page and endpoint renderers.
 *
 * Handles: prerender query stripping, pathname computation, component loading,
 * RenderContext creation, cache integration, error page rendering (404/500),
 * session persistence, reroutable status handling, and response cleanup.
 *
 * The `renderFn` callback receives the created RenderContext and loaded
 * ComponentInstance so the caller can perform the actual rendering
 * (renderPage vs renderEndpoint).
 */
export async function prepareForRender(
	pipeline: Pipeline,
	manifest: SSRManifest,
	manifestData: RoutesList,
	logger: AstroLogger,
	request: Request,
	routeData: RouteData,
	options: PrepareOptions,
	renderFn: (renderContext: RenderContext, componentInstance: ComponentInstance) => Promise<Response>,
): Promise<Response> {
	const {
		clientAddress,
		locals,
		skipMiddleware = false,
		cookies: sharedCookies,
		session: sharedSession,
		prerenderedErrorPageFetch = getRenderOptions(request)?.prerenderedErrorPageFetch ?? fetch,
		isDev = false,
	} = options;

	const url = new URL(request.url);

	// For prerendered routes, strip query params from the request URL
	// so that Astro.request.url doesn't expose them in static output.
	if (routeData.prerender && url.search) {
		url.search = '';
		request = new Request(url, request);
	}

	let pathname = getPathnameFromRequest(request, manifest.base);
	if (!routeHasHtmlExtension(routeData)) {
		pathname = pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
	}

	// Set originPathname on the request if not already set (rewrites preserve the original).
	if (!Reflect.get(request, originPathnameSymbol)) {
		setOriginPathname(request, pathname, manifest.trailingSlash, manifest.buildFormat);
	}

	const defaultStatus = getDefaultStatusCode(routeData, pathname);

	let response: Response;
	let session: AstroSession | undefined;
	let cache: CacheLike | undefined;
	let renderContext: RenderContext | undefined;
	try {
		const componentInstance = await pipeline.getComponentByRoute(routeData);
		renderContext = await RenderContext.create({
			pipeline,
			locals,
			pathname,
			request,
			routeData,
			status: defaultStatus,
			clientAddress,
			skipMiddleware,
			cookies: sharedCookies,
			session: sharedSession,
		} as CreateRenderContext);
		session = renderContext.session;
		cache = renderContext.cache;

		if (pipeline.cacheProvider) {
			const cacheProvider = await pipeline.getCacheProvider();
			if (cacheProvider?.onRequest) {
				response = await cacheProvider.onRequest(
					{ request, url: new URL(request.url) },
					async () => {
						const res = await renderFn(renderContext!, componentInstance);
						applyCacheHeaders(cache!, res);
						return res;
					},
				);
				response.headers.delete('CDN-Cache-Control');
				response.headers.delete('Cache-Tag');
			} else {
			response = await renderFn(renderContext!, componentInstance);
			applyCacheHeaders(cache!, response);
		}
	} else {
		response = await renderFn(renderContext!, componentInstance);
		}
	} catch (err: any) {
		// A getStaticPaths route matched the pattern but the specific params
		// aren't in the static paths list. Treat this as a 404, not a 500.
		if (isAstroError(err) && err.title === NoMatchingStaticPathFound.title) {
			logger.warn('router', err.message);
			return renderErrorPage(pipeline, manifest, manifestData, logger, request, {
				clientAddress,
				locals,
				prerenderedErrorPageFetch,
				isDev,
				status: 404,
				error: err,
			});
		}
		logger.error(null, err.stack || err.message || String(err));
		// In dev, re-throw so the error reaches the Vite error overlay
		// unless there's a custom 500 page.
		if (isDev) {
			const errorRoutePath = `/500${manifest.trailingSlash === 'always' ? '/' : ''}`;
			const custom500 = matchRoute(errorRoutePath, manifestData);
			if (!custom500) throw err;
		}
		return renderErrorPage(pipeline, manifest, manifestData, logger, request, {
			clientAddress,
			locals,
			prerenderedErrorPageFetch,
			isDev,
			status: 500,
			error: err,
		});
	} finally {
		await session?.[PERSIST_SYMBOL]();
	}

	// If the page returned a reroutable status (404/500) with no body,
	// render the appropriate error page instead.
	if (
		REROUTABLE_STATUS_CODES.includes(response.status) &&
		response.body === null &&
		response.headers.get(REROUTE_DIRECTIVE_HEADER) !== 'no'
	) {
		return renderErrorPage(pipeline, manifest, manifestData, logger, request, {
			clientAddress,
			locals,
			prerenderedErrorPageFetch,
			isDev,
			status: response.status as 404 | 500,
			response,
			error: response.status === 500 ? null : undefined,
		});
	}

	// Attach RenderContext cookies to the response so createPagesMiddleware can collect them.
	if (renderContext) {
		attachCookiesToResponse(response, renderContext.cookies);
	}

	prepareResponse(response);
	return response;
}

// ---------------------------------------------------------------------------
// Prepare context (no callback)
// ---------------------------------------------------------------------------

export interface PreparedRender {
	renderContext: RenderContext;
	componentInstance: ComponentInstance;
	session: AstroSession | undefined;
	cache: CacheLike | undefined;
}

/**
 * Prepares the RenderContext and loads the component without calling renderPage.
 * Avoids the callback indirection of `prepareForRender`.
 */
export async function prepareRenderContext(
	pipeline: Pipeline,
	manifest: SSRManifest,
	_logger: AstroLogger,
	request: Request,
	routeData: RouteData,
	options: PrepareOptions,
): Promise<PreparedRender> {
	const {
		clientAddress,
		locals,
		skipMiddleware = false,
		cookies: sharedCookies,
		session: sharedSession,
	} = options;

	const url = new URL(request.url);
	if (routeData.prerender && url.search) {
		url.search = '';
		request = new Request(url, request);
	}

	let pathname = getPathnameFromRequest(request, manifest.base);
	if (!routeHasHtmlExtension(routeData)) {
		pathname = pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
	}

	if (!Reflect.get(request, originPathnameSymbol)) {
		setOriginPathname(request, pathname, manifest.trailingSlash, manifest.buildFormat);
	}

	const defaultStatus = getDefaultStatusCode(routeData, pathname);
	const componentInstance = await pipeline.getComponentByRoute(routeData);
	const renderContext = await RenderContext.create({
		pipeline,
		locals,
		pathname,
		request,
		routeData,
		status: defaultStatus,
		clientAddress,
		skipMiddleware,
		cookies: sharedCookies,
		session: sharedSession,
	} as CreateRenderContext);

	return {
		renderContext,
		componentInstance,
		session: renderContext.session,
		cache: renderContext.cache,
	};
}

/**
 * Post-processing after rendering: session persist, reroutable status check,
 * cookie attachment, response cleanup.
 */
export async function finalizeRender(
	pipeline: Pipeline,
	manifest: SSRManifest,
	_logger: AstroLogger,
	request: Request,
	response: Response,
	prepared: PreparedRender,
	options: PrepareOptions,
): Promise<Response> {
	const { renderContext, session } = prepared;
	const {
		clientAddress,
		locals,
		prerenderedErrorPageFetch = getRenderOptions(request)?.prerenderedErrorPageFetch ?? fetch,
		isDev = false,
	} = options;

	await session?.[PERSIST_SYMBOL]();

	if (
		REROUTABLE_STATUS_CODES.includes(response.status) &&
		response.body === null &&
		response.headers.get(REROUTE_DIRECTIVE_HEADER) !== 'no'
	) {
		return renderErrorPage(pipeline, manifest, pipeline.manifestData, _logger, request, {
			clientAddress,
			locals,
			prerenderedErrorPageFetch,
			isDev,
			status: response.status as 404 | 500,
			response,
			error: response.status === 500 ? null : undefined,
		});
	}

	attachCookiesToResponse(response, renderContext.cookies);
	prepareResponse(response);
	return response;
}

// ---------------------------------------------------------------------------
// Error page rendering
// ---------------------------------------------------------------------------

interface RenderErrorOptions extends PrepareOptions {
	status: 404 | 500;
	response?: Response;
	error?: unknown;
}

async function renderErrorPage(
	pipeline: Pipeline,
	manifest: SSRManifest,
	manifestData: RoutesList,
	logger: AstroLogger,
	request: Request,
	options: RenderErrorOptions,
): Promise<Response> {
	const {
		status,
		response: originalResponse,
		error,
		clientAddress,
		locals,
		prerenderedErrorPageFetch = getRenderOptions(request)?.prerenderedErrorPageFetch ?? fetch,
		isDev = false,
	} = options;

	const errorRoutePath = `/${status}${manifest.trailingSlash === 'always' ? '/' : ''}`;
	const errorRouteData = matchRoute(errorRoutePath, manifestData);
	const url = new URL(request.url);

	if (errorRouteData) {
		// In production, prerendered error pages are fetched as static assets.
		// In dev, always render the component directly so that Astro.url
		// reflects the originally-requested path, not /404.html.
		if (errorRouteData.prerender && !isDev) {
			const maybeDotHtml = errorRouteData.route.endsWith(`/${status}`) ? '.html' : '';
			const statusURL = new URL(
				`${removeTrailingForwardSlash(manifest.base)}/${status}${maybeDotHtml}`,
				url,
			);
			if (statusURL.toString() !== request.url && prerenderedErrorPageFetch) {
				try {
					const response = await prerenderedErrorPageFetch(statusURL.toString());
					const override = { status, removeContentEncodingHeaders: true };
					const newResponse = mergeResponses(response, originalResponse, override);
					prepareResponse(newResponse);
					return newResponse;
				} catch {
					// Fetch failed (e.g. during build when no server is running).
					// Fall through to render the component directly.
				}
			}
		}

		const mod = await pipeline.getComponentByRoute(errorRouteData);
		const pathname = getPathnameFromRequest(request, manifest.base);
		const cookies = new AstroCookies(request);
		const serverIslands = await pipeline.getServerIslands();
		const pipelineSessionDriver = await pipeline.getSessionDriver();
		const session =
			pipeline.manifest.sessionConfig && pipelineSessionDriver
				? new (await import('../session/runtime.js')).AstroSession({
						cookies,
						config: pipeline.manifest.sessionConfig,
						runtimeMode: pipeline.runtimeMode,
						driverFactory: pipelineSessionDriver,
						mockStorage: null,
					})
				: undefined;

		setOriginPathname(request, pathname, manifest.trailingSlash, manifest.buildFormat);

		try {
			const params = getParams(errorRouteData, pathname);
			const props = { error };

			const result = await createSSRResult({
				pipeline,
				routeData: errorRouteData,
				mod,
				request,
				pathname,
				params,
				status,
				locals: locals ?? {},
				cookies,
				url,
				clientAddress,
				session,
				cache: undefined,
				shouldInjectCspMetaTags: manifest.shouldInjectCspMetaTags,
				serverIslandNameMap: serverIslands.serverIslandNameMap ?? new Map(),
				partial: undefined,
				rewrite: async () => {
					throw new Error('Cannot rewrite from an error page.');
				},
			});

			const response = await renderPage(
				result,
				mod?.default as any,
				props,
				{},
				pipeline.streaming,
				errorRouteData,
			);

			response.headers.set(ROUTE_TYPE_HEADER, 'page');
			response.headers.set(REROUTE_DIRECTIVE_HEADER, 'no');

			const newResponse = mergeResponses(response, originalResponse);
			prepareResponse(newResponse);
			return newResponse;
		} catch (renderError) {
			logger.error(null, (renderError as any)?.stack || String(renderError));
		} finally {
			await session?.[PERSIST_SYMBOL]();
		}
	}

	const response = mergeResponses(new Response(null, { status }), originalResponse);
	// Preserve the error details so BuildApp can extract them from the response.
	if (error) {
		const msg = error instanceof Error ? error.message : String(error);
		try {
			response.headers.set('X-Astro-Error', msg);
			if (error instanceof Error && error.name !== 'Error') {
				response.headers.set('X-Astro-Error-Name', error.name);
			}
		} catch { /* immutable headers */ }
	}
	prepareResponse(response);
	return response;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPathnameFromRequest(request: Request, base: string): string {
	const url = new URL(request.url);
	const pathname = prependForwardSlash(removeBase(url.pathname, base));
	try {
		return decodeURI(pathname);
	} catch {
		return pathname;
	}
}

function getDefaultStatusCode(routeData: RouteData, pathname: string): number {
	if (!routeData.pattern.test(pathname)) {
		for (const fallbackRoute of routeData.fallbackRoutes) {
			if (fallbackRoute.pattern.test(pathname)) {
				return 302;
			}
		}
	}
	const route = removeTrailingForwardSlash(routeData.route);
	if (route.endsWith('/404')) return 404;
	if (route.endsWith('/500')) return 500;
	return 200;
}

function prepareResponse(response: Response): void {
	Reflect.set(response, responseSentSymbol, true);
}

function mergeResponses(
	newResponse: Response,
	originalResponse?: Response,
	override?: {
		status: 404 | 500;
		removeContentEncodingHeaders: boolean;
	},
): Response {
	let newResponseHeaders = newResponse.headers;

	if (override?.removeContentEncodingHeaders) {
		newResponseHeaders = new Headers(newResponseHeaders);
		newResponseHeaders.delete('Content-Encoding');
		newResponseHeaders.delete('Content-Length');
	}

	if (!originalResponse) {
		if (override !== undefined) {
			return new Response(newResponse.body, {
				status: override.status,
				statusText: newResponse.statusText,
				headers: newResponseHeaders,
			});
		}
		return newResponse;
	}

	const status = override?.status
		? override.status
		: originalResponse.status === 200
			? newResponse.status
			: originalResponse.status;

	try {
		originalResponse.headers.delete('Content-type');
		originalResponse.headers.delete('Content-Length');
		originalResponse.headers.delete('Transfer-Encoding');
	} catch {
		// Headers may be immutable
	}

	const newHeaders = new Headers();
	const seen = new Set<string>();
	for (const [name, value] of originalResponse.headers) {
		newHeaders.append(name, value);
		seen.add(name.toLowerCase());
	}
	for (const [name, value] of newResponseHeaders) {
		if (!seen.has(name.toLowerCase())) {
			newHeaders.append(name, value);
		}
	}

	const mergedResponse = new Response(newResponse.body, {
		status,
		statusText: status === 200 ? newResponse.statusText : originalResponse.statusText,
		headers: newHeaders,
	});

	const originalCookies = getCookiesFromResponse(originalResponse);
	const newCookies = getCookiesFromResponse(newResponse);
	if (originalCookies) {
		if (newCookies) {
			for (const cookieValue of AstroCookies.consume(newCookies)) {
				originalResponse.headers.append('set-cookie', cookieValue);
			}
		}
		attachCookiesToResponse(mergedResponse, originalCookies);
	} else if (newCookies) {
		attachCookiesToResponse(mergedResponse, newCookies);
	}

	return mergedResponse;
}

export { renderErrorPage };
