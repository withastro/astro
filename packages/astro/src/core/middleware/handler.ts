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
 * Handles user middleware execution around a `next` callback.
 *
 * Use `hasMiddleware()` to check whether there is actual user middleware.
 * When there is none, callers can skip `handle()` entirely and call
 * the next step directly, avoiding unnecessary async boundaries.
 */
export class UserMiddlewareHandler {
	#pipeline: Pipeline;
	#manifest: SSRManifest;
	#logger: AstroLogger;
	#isDev: boolean;
	#options: UserMiddlewareHandlerOptions;
	#resolvedMiddleware: Awaited<ReturnType<Pipeline['getMiddleware']>> | undefined;
	#resolved = false;

	constructor(deps: UserMiddlewareHandlerDeps, options: UserMiddlewareHandlerOptions = {}) {
		this.#pipeline = deps.pipeline;
		this.#manifest = deps.manifest;
		this.#logger = deps.logger;
		this.#isDev = options.isDev ?? (deps.pipeline.runtimeMode === 'development');
		this.#options = options;
	}

	/**
	 * Resolves the middleware once (lazy, cached). Must be called before
	 * `hasMiddleware()` returns a meaningful result.
	 */
	async resolve(): Promise<void> {
		if (!this.#resolved) {
			this.#resolvedMiddleware = await this.#pipeline.getMiddleware();
			this.#resolved = true;
		}
	}

	/**
	 * Returns true if there is actual user middleware to run.
	 * Call `resolve()` first.
	 */
	hasMiddleware(): boolean {
		return this.#resolved && this.#resolvedMiddleware !== NOOP_MIDDLEWARE_FN;
	}

	/**
	 * Runs the user middleware around the `next` callback.
	 * Only call this when `hasMiddleware()` returns true.
	 */
	async handle(state: FetchState, next: () => Promise<Response>): Promise<Response> {
		const pipeline = this.#pipeline;
		const manifest = this.#manifest;
		const logger = this.#logger;
		const isDev = this.#isDev;
		const options = this.#options;
		const resolvedMiddleware = this.#resolvedMiddleware!;

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
	}
}

// Keep the factory function for backward compatibility (hono-app.ts uses it)
export function createUserMiddlewareHandler(
	deps: UserMiddlewareHandlerDeps,
	options: UserMiddlewareHandlerOptions = {},
): (state: FetchState, next: () => Promise<Response>) => Promise<Response> {
	const handler = new UserMiddlewareHandler(deps, options);
	return (state, next) => handler.handle(state, next);
}
