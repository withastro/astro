import type { RenderErrorOptions } from '../app/base.js';
import type { SSRManifest } from '../app/types.js';
import { getEnvironment } from '../environment/index.js';
import { FetchState } from '../fetch/fetch-state.js';
import type { RouteData } from '../../types/public/index.js';
import { getLogger } from '../logger/manifest-logger.js';
import { handleMiddleware } from '../middleware/astro-middleware.js';
import { handlePages } from '../pages/handler.js';
import { getCustom404Route, getCustom500Route } from '../routing/helpers.js';
import { getRouteTable } from '../routing/route-table.js';
import { type AstroError, isAstroError } from './index.js';
import { MiddlewareNoDataOrNextCalled, MiddlewareNotAResponse } from './errors-data.js';
import { rewroteToEmptyErrorResponse } from './handler.js';

export interface DevErrorHandlerOptions {
	/**
	 * Whether to inject CSP meta tags into the rendered error page response.
	 * The Vite dev server injects them; the non-runnable dev pipeline does not.
	 */
	shouldInjectCspMetaTags: boolean;
}

/**
 * The dev-server error strategy. Renders custom 404/500 routes if the user
 * has them, otherwise throws so Vite's dev overlay is shown. Shared between
 * the Vite dev server and the non-runnable dev pipeline; only
 * `shouldInjectCspMetaTags` differs between them (carried by the
 * environment record's `injectCspMetaTagsOnErrorPages` static).
 */
export async function renderDevError(
	manifest: SSRManifest,
	request: Request,
	{
		skipMiddleware = false,
		error,
		status,
		response: _response,
		pathname,
		...resolvedRenderOptions
	}: RenderErrorOptions,
	{ shouldInjectCspMetaTags }: DevErrorHandlerOptions,
): Promise<Response> {
	// we always throw when we have Astro errors around the middleware
	if (
		isAstroError(error) &&
		[MiddlewareNoDataOrNextCalled.name, MiddlewareNotAResponse.name].includes((error as any).name)
	) {
		throw error;
	}

	const resolvedPathname = pathname ?? new FetchState(manifest, request).pathname;

	const renderRoute = async (routeData: RouteData): Promise<Response> => {
		try {
			const preloadedComponent = await getEnvironment(manifest).getComponentByRoute(
				manifest,
				routeData,
			);
			const errorState = new FetchState(manifest, request);
			errorState.skipMiddleware = skipMiddleware;
			errorState.clientAddress = resolvedRenderOptions.clientAddress;
			errorState.shouldInjectCspMetaTags = shouldInjectCspMetaTags ? !!manifest.csp : false;
			errorState.routeData = routeData;
			errorState.pathname = resolvedPathname;
			errorState.status = status;
			errorState.componentInstance = preloadedComponent;
			errorState.locals = resolvedRenderOptions.locals ?? ({} as App.Locals);
			errorState.initialProps = { error };
			const response = await handleMiddleware(errorState, handlePages);

			// A middleware rewrite issued while rendering the error page swaps the
			// state's routeData away from the error route. If that hijacked render
			// produced another empty reroutable error response, retry rendering the
			// error page without middleware (same fallback used when middleware throws).
			if (rewroteToEmptyErrorResponse(skipMiddleware, routeData, errorState.routeData, response)) {
				return renderDevError(
					manifest,
					request,
					{
						...resolvedRenderOptions,
						status,
						error,
						skipMiddleware: true,
						pathname: resolvedPathname,
					},
					{ shouldInjectCspMetaTags },
				);
			}

			if (error) {
				// Log useful information that the custom 500 page may not display unlike the default error overlay
				getLogger(manifest).error(
					'router',
					(error as AstroError).stack || (error as AstroError).message,
				);
			}

			return response;
		} catch (_err) {
			if (skipMiddleware === false) {
				return renderDevError(
					manifest,
					request,
					{
						...resolvedRenderOptions,
						status: 500,
						skipMiddleware: true,
						error: _err,
						pathname: resolvedPathname,
					},
					{ shouldInjectCspMetaTags },
				);
			}
			// If even skipping the middleware isn't enough to prevent the error, show the dev overlay
			throw _err;
		}
	};

	// Custom error routes are read off the single per-manifest route table, so
	// they stay HMR-fresh.
	if (status === 404) {
		const custom404 = getCustom404Route(getRouteTable(manifest));
		if (custom404) {
			return renderRoute(custom404);
		}
	}

	const custom500 = getCustom500Route(getRouteTable(manifest));

	// Show dev overlay
	if (!custom500) {
		throw error;
	} else {
		return renderRoute(custom500);
	}
}
