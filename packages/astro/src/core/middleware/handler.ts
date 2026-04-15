import type { SSRManifest } from '../../types/public/index.js';
import type { Pipeline } from '../base-pipeline.js';
import type { AstroLogger } from '../logger/core.js';
import type { FetchState } from '../app/fetch-state.js';
import { clientAddressSymbol, REROUTABLE_STATUS_CODES, REROUTE_DIRECTIVE_HEADER } from '../constants.js';
import { ForbiddenRewrite } from '../errors/errors-data.js';
import { AstroError } from '../errors/index.js';
import { getRenderOptions, copyRenderOptions } from '../app/render-options-store.js';
import { prepareForRender, renderErrorPage } from '../app/prepare.js';
import { attachCookiesToResponse, getSetCookiesFromResponse } from '../cookies/response.js';
import { callMiddleware } from './callMiddleware.js';
import { NOOP_MIDDLEWARE_FN } from './noop-middleware.js';

export interface UserMiddlewareHandlerOptions {
	isDev?: boolean;
	addCookieHeader?: boolean;
}

export interface UserMiddlewareHandlerDeps {
	pipeline: Pipeline;
	manifest: SSRManifest;
	logger: AstroLogger;
}

/**
 * Creates a handler that runs the user's Astro middleware around a `next`
 * callback. The `next` callback is responsible for rendering the page (or
 * doing whatever the downstream pipeline does).
 *
 * Returns `(state, next) => Promise<Response>`.
 */
export function createUserMiddlewareHandler(
	deps: UserMiddlewareHandlerDeps,
	options: UserMiddlewareHandlerOptions = {},
): (state: FetchState, next: () => Promise<Response>) => Promise<Response> {
	const { pipeline, manifest, logger } = deps;
	const isDev = options.isDev ?? (pipeline.runtimeMode === 'development');
	let resolvedMiddleware: Awaited<ReturnType<typeof pipeline.getMiddleware>> | undefined;

	return async (state: FetchState, next: () => Promise<Response>): Promise<Response> => {
		if (!resolvedMiddleware) {
			resolvedMiddleware = await pipeline.getMiddleware();
		}
		if (resolvedMiddleware === NOOP_MIDDLEWARE_FN) {
			return next();
		}

		const request = state.request;
		const ctx = await state.getAPIContext();
		let response: Response;
		try {
		response = await callMiddleware(resolvedMiddleware, ctx, async (_apiContext, rewritePayload) => {
			if (rewritePayload) {
				// Middleware called next(rewritePayload) — resolve the rewrite target.
				const { routeData, pathname: rewritePathname, newUrl } = await pipeline.tryRewrite(rewritePayload, request);
				// Forbid SSR → prerendered rewrites in server mode
				if (
					pipeline.manifest.serverLike === true &&
					!ctx.isPrerendered &&
					routeData.prerender === true
				) {
					throw new AstroError({
						...ForbiddenRewrite,
						message: ForbiddenRewrite.message(
							new URL(request.url).pathname,
							rewritePathname,
							routeData.component,
						),
						hint: ForbiddenRewrite.hint(routeData.component),
					});
				}
				const newRequest = rewritePayload instanceof Request
					? rewritePayload
					: new Request(newUrl, request);
				copyRenderOptions(request, newRequest);
				for (const setCookieValue of ctx.cookies.headers()) {
					newRequest.headers.append('cookie', setCookieValue.split(';')[0]);
				}
				return prepareForRender(pipeline, manifest, pipeline.manifestData, logger, newRequest, routeData, {
					locals: ctx.locals,
					clientAddress: getRenderOptions(request)?.clientAddress ?? Reflect.get(request, clientAddressSymbol) as string | undefined,
					cookies: ctx.cookies, session: ctx.session as any,
					skipMiddleware: true,
					isDev,
				}, (renderCtx, comp) => renderCtx.render(comp));
			}
			return next();
		});
		} catch (err) {
			// In dev, re-throw if there's no custom 500 page so the Vite error overlay shows.
			if (isDev) {
				const { matchRoute } = await import('../routing/match.js');
				const errorRoutePath = `/500${manifest.trailingSlash === 'always' ? '/' : ''}`;
				const custom500 = matchRoute(errorRoutePath, pipeline.manifestData);
				if (!custom500) throw err;
			}
			logger.error(null, (err as any)?.stack || String(err));
			return renderErrorPage(pipeline, manifest, pipeline.manifestData, logger, request, {
				locals: ctx.locals,
				clientAddress: getRenderOptions(request)?.clientAddress ?? Reflect.get(request, clientAddressSymbol) as string | undefined,
				status: 500,
				error: err,
				isDev,
			});
		}

		// Ensure cookies are attached and appended for responses that bypassed
		// createPagesMiddleware (e.g. rewrite responses from ctx.rewrite()).
		attachCookiesToResponse(response, ctx.cookies);
		const shouldAddCookies = getRenderOptions(request)?.addCookieHeader ?? options.addCookieHeader ?? true;
		if (shouldAddCookies && !response.headers.has('set-cookie')) {
			for (const setCookieValue of getSetCookiesFromResponse(response)) {
				response.headers.append('set-cookie', setCookieValue);
			}
		}

		// If user middleware returned a reroutable status (404/500) with no body
		// (e.g. i18n middleware rejecting an invalid locale), render the error page.
		if (
			REROUTABLE_STATUS_CODES.includes(response.status) &&
			response.body === null &&
			response.headers.get(REROUTE_DIRECTIVE_HEADER) !== 'no'
		) {
			response = await renderErrorPage(pipeline, manifest, pipeline.manifestData, logger, request, {
				locals: ctx.locals,
				clientAddress: getRenderOptions(request)?.clientAddress ?? Reflect.get(request, clientAddressSymbol) as string | undefined,
				status: response.status as 404 | 500,
				response,
				isDev,
			});
			// Re-apply cookies to the error page response since the original response was replaced.
			if (shouldAddCookies) {
				for (const setCookieValue of ctx.cookies.headers()) {
					response.headers.append('set-cookie', setCookieValue);
				}
			}
		}

		return response;
	};
}
