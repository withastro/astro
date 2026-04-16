import type { SSRManifest } from '../../types/public/index.js';
import type { RouteData } from '../../types/public/internal.js';
import type { Pipeline } from '../base-pipeline.js';
import type { AstroLogger } from '../logger/core.js';
import type { FetchState } from '../app/fetch-state.js';
import { clientAddressSymbol, REROUTABLE_STATUS_CODES, REROUTE_DIRECTIVE_HEADER, ROUTE_TYPE_HEADER } from '../constants.js';
import { PERSIST_SYMBOL } from '../session/runtime.js';
import { getRenderOptions } from '../app/render-options-store.js';
import { renderErrorPage, type PrepareOptions } from '../app/prepare.js';
import { attachCookiesToResponse } from '../cookies/response.js';
import { applyCacheHeaders } from '../cache/runtime/cache.js';
import { PageRenderer } from './renderers/page.js';
import { EndpointRenderer } from './renderers/endpoint.js';
import { RedirectRenderer } from './renderers/redirect.js';

export interface PagesHandlerOptions extends PrepareOptions {
	isDev?: boolean;
	addCookieHeader?: boolean;
}

export interface PagesHandlerDeps {
	pipeline: Pipeline;
	manifest: SSRManifest;
	logger: AstroLogger;
}

/**
 * Creates a terminal handler that renders the matched route (page, endpoint,
 * or redirect). Always returns a Response — there is no `next()`.
 *
 * The `matchRouteData` callback is used to resolve a route if one isn't
 * already set on the FetchState.
 */
export function createPagesHandler(
	deps: PagesHandlerDeps,
	matchRouteData: (req: Request) => RouteData | undefined,
	options: PagesHandlerOptions = {},
): (state: FetchState) => Promise<Response> {
	const { pipeline, manifest, logger } = deps;
	const isDev = options.isDev ?? (pipeline.runtimeMode === 'development');

	const pageRenderer = new PageRenderer(pipeline, manifest, () => pipeline.manifestData, logger);
	const endpointRenderer = new EndpointRenderer(pipeline, logger);
	const redirectRenderer = new RedirectRenderer(manifest);

	return async (state: FetchState): Promise<Response> => {
		const request = state.request;
		const routeData = state.routeData ?? matchRouteData(request);
		if (!routeData) {
			const ctx = await state.getAPIContext();
			const response = await renderErrorPage(pipeline, manifest, pipeline.manifestData, logger, request, {
				locals: ctx.locals,
				clientAddress: getRenderOptions(request)?.clientAddress ?? Reflect.get(request, clientAddressSymbol) as string | undefined,
				status: 404,
				isDev,
			});
			// Ensure ROUTE_TYPE_HEADER is set so i18n middleware can detect page responses
			if (!response.headers.has(ROUTE_TYPE_HEADER)) {
				response.headers.set(ROUTE_TYPE_HEADER, 'page');
			}
			return response;
		}

		state.routeData = routeData;

		if (routeData.type === 'redirect') {
			const response = redirectRenderer.render(request, routeData);
			response.headers.set(ROUTE_TYPE_HEADER, 'redirect');
			return response;
		}

		const ctx = await state.getAPIContext();
		let response: Response;

		if (routeData.type === 'endpoint') {
			// Wrap endpoint rendering in the cache provider if configured,
			// so that cache MISS/HIT headers and CDN headers are applied.
			if (pipeline.cacheProvider) {
				const cacheProvider = await pipeline.getCacheProvider();
				if (cacheProvider?.onRequest) {
					response = await cacheProvider.onRequest(
						{ request, url: new URL(request.url) },
						async () => {
							const res = await endpointRenderer.render(routeData, ctx);
							applyCacheHeaders(ctx.cache, res);
							return res;
						},
					);
					response.headers.delete('CDN-Cache-Control');
					response.headers.delete('Cache-Tag');
				} else {
					response = await endpointRenderer.render(routeData, ctx);
					applyCacheHeaders(ctx.cache, response);
				}
			} else {
				response = await endpointRenderer.render(routeData, ctx);
			}
			try { response.headers.set(ROUTE_TYPE_HEADER, 'endpoint'); } catch { /* immutable headers */ }
			if (
				REROUTABLE_STATUS_CODES.includes(response.status) &&
				response.body === null &&
				response.headers.get(REROUTE_DIRECTIVE_HEADER) !== 'no'
			) {
				response = await renderErrorPage(pipeline, manifest, pipeline.manifestData, logger, request, {
					locals: ctx.locals,
					clientAddress: getRenderOptions(request)?.clientAddress ?? Reflect.get(request, clientAddressSymbol) as string | undefined,
					status: response.status as 404 | 500,
					isDev,
				});
			}
		} else {
			response = await pageRenderer.render(request, routeData, {
				...options,
				locals: ctx.locals,
				clientAddress: getRenderOptions(request)?.clientAddress ?? Reflect.get(request, clientAddressSymbol) as string | undefined,
				cookies: ctx.cookies, session: ctx.session as any,
				isDev,
				skipMiddleware: true,
			});
			// PageRenderer already sets ROUTE_TYPE_HEADER via renderPage, but ensure
			// it's set for fallback/error paths too
			if (!response.headers.has(ROUTE_TYPE_HEADER)) {
				response.headers.set(ROUTE_TYPE_HEADER, routeData.type);
			}
		}

		// Persist session data to storage (e.g. fs, redis) after the request
		if (ctx.session) {
			await (ctx.session as any)[PERSIST_SYMBOL]?.();
		}

		attachCookiesToResponse(response, ctx.cookies);

		const shouldAddCookies = getRenderOptions(request)?.addCookieHeader ?? options.addCookieHeader ?? true;
		if (shouldAddCookies) {
			const existingCookies = new Set(response.headers.getSetCookie?.() ?? []);
			for (const setCookieValue of ctx.cookies.headers()) {
				if (!existingCookies.has(setCookieValue)) {
					response.headers.append('set-cookie', setCookieValue);
				}
			}
		}

		return response;
	};
}
