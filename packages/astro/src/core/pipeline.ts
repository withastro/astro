import type { APIContext, ComponentInstance, MiddlewareHandler, RouteData } from '../@types/astro.js';
import { renderEndpoint } from '../runtime/server/endpoint.js';
import { attachCookiesToResponse } from './cookies/index.js';
import { callMiddleware } from './middleware/callMiddleware.js';
import { sequence } from './middleware/index.js';
import { AstroCookies } from './cookies/index.js';
import { createResult } from './render/index.js';
import { renderPage } from '../runtime/server/index.js';
import { ASTRO_VERSION, ROUTE_TYPE_HEADER, clientAddressSymbol, clientLocalsSymbol } from './constants.js';
import { getParamsAndProps, type Environment, type RenderContext } from './render/index.js';
import { AstroError, AstroErrorData } from './errors/index.js';
import {
	computeCurrentLocale,
	computePreferredLocale,
	computePreferredLocaleList,
} from './render/context.js';
import { renderRedirect } from './redirects/render.js';

/**
 * This is the basic class of a pipeline.
 *
 * Check the {@link ./README.md|README} for more information about the pipeline.
 */
export class Pipeline {

	private constructor(
		readonly environment: Environment,
		public locals: App.Locals,
		readonly middleware: MiddlewareHandler,
		readonly pathname: string,
		readonly renderContext: RenderContext,
		readonly request: Request,
		readonly cookies = new AstroCookies(request),
	) {}

	static create({ environment, locals, middleware, pathname, renderContext, request }: Pick<Pipeline, 'environment' | 'pathname' | 'renderContext' | 'request'> & Partial<Pick<Pipeline, 'locals' | 'middleware'>>) {
		return new Pipeline(environment, locals ?? {}, sequence(...environment.internalMiddleware, middleware ?? environment.middleware), pathname, renderContext, request)
	}

	/**
	 * The main function of the pipeline. Use this function to render any route known to Astro;
	 * It attempts to render a route. A route can be a:
	 * - page
	 * - redirect
	 * - endpoint
	 * - fallback
	 */
	async renderRoute(
		componentInstance: ComponentInstance | undefined
	): Promise<Response> {
		const { cookies, environment, middleware, renderContext } = this;
		const [ params, props ] = await this.getParamsAndProps(componentInstance!, renderContext.route);
		const { logger, serverLike, streaming } = environment;
		const { type } = renderContext.route;
		const apiContext = this.createAPIContext({ props, params });
		const lastNext =
			type === 'endpoint' ? () => renderEndpoint(componentInstance as any, apiContext, serverLike, logger) :
			type === 'redirect' ? () => renderRedirect(this, renderContext) :
			type === 'page'     ? async () => {
				const result = await this.createResult(componentInstance!, renderContext.route);
				const response = await renderPage(result, componentInstance?.default as any, props, {}, streaming, renderContext.route);
				response.headers.set(ROUTE_TYPE_HEADER, "page");
				return response;
			} :
			type === 'fallback' ? () => new Response(null, { status: 500, headers: { [ROUTE_TYPE_HEADER]: "fallback" } }) :
			() => { throw new Error("Unknown type of route: " + type) }
		const response = await callMiddleware(middleware, apiContext, lastNext);
		if (response.headers.get(ROUTE_TYPE_HEADER)) {
			response.headers.delete(ROUTE_TYPE_HEADER)
		}
		// LEGACY: we put cookies on the response object,
		// where the adapter might be expecting to read it.
		// New code should be using `app.render({ addCookieHeader: true })` instead.
		attachCookiesToResponse(response, cookies);
		return response;
	}

	createAPIContext({ params, props }: Pick<APIContext, 'params' | 'props'>): APIContext {
		const pipeline = this;
		const { cookies, environment, i18nData, request } = this;
		const { currentLocale, preferredLocale, preferredLocaleList } = i18nData;
		const generator = `Astro v${ASTRO_VERSION}`;
		const redirect = (path: string, status = 302) => new Response(null, { status, headers: { Location: path } });
		const site = environment.site ? new URL(environment.site) : undefined;
		const url = new URL(request.url);
		return {
			cookies, currentLocale, generator, params, preferredLocale, preferredLocaleList, props, redirect, request, site, url,
			get clientAddress() {
				if (clientAddressSymbol in request) {
					return Reflect.get(request, clientAddressSymbol) as string;
				}
				if (environment.adapterName) {
					throw new AstroError({
						...AstroErrorData.ClientAddressNotAvailable,
						message: AstroErrorData.ClientAddressNotAvailable.message(environment.adapterName),
					});
				} else {
					throw new AstroError(AstroErrorData.StaticClientAddressNotAvailable);
				}
			},
			get locals() {
				return pipeline.locals;
			},
			// We define a custom property, so we can check the value passed to locals
			set locals(val) {
				if (typeof val !== 'object') {
					throw new AstroError(AstroErrorData.LocalsNotAnObject);
				} else {
					pipeline.locals = val;
					// LEGACY: we also put it on the original Request object,
					// where the adapter might be expecting to read it after the response.
					Reflect.set(request, clientLocalsSymbol, val);
				}
			}
		}
	}

	async createResult(mod: ComponentInstance, routeData: RouteData) {
		const { cookies, environment, locals, pathname, renderContext, request } = this;
		const { componentMetadata, links, route: { route }, scripts, styles, status = 200 } = renderContext;
		const { adapterName, clientDirectives, compressHTML, i18n, logger, renderers, resolve, site, serverLike } = environment;
		const { defaultLocale, locales, routing: routingStrategy } = i18n ?? {};
		const [ params, props ] = await this.getParamsAndProps(mod, routeData);
		const partial = Boolean(mod.partial);
		return createResult({ adapterName, clientDirectives, componentMetadata, compressHTML, cookies, defaultLocale, locales, locals, logger, links, params, partial, pathname, renderers, resolve, request, route, routingStrategy, site, scripts, ssr: serverLike, status, styles });
	}

	getParamsAndProps(mod: ComponentInstance, routeData: RouteData) {
		const { environment: { logger, routeCache, serverLike }, pathname } = this;
		return getParamsAndProps({ mod, routeData, routeCache, pathname, logger, serverLike })
	}

	/**
	 * API Context may be created multiple times per request, i18n data needs to be computed only once.
	 * So, it is computed and saved here on creation of the first APIContext and reused for later ones.
	 */
	#i18nData?: Pick<APIContext, "currentLocale" | "preferredLocale" | "preferredLocaleList">

	get i18nData() {
		if (this.#i18nData) return this.#i18nData
		const { environment: { i18n }, request, renderContext } = this;
		if (!i18n) return {
			currentLocale: undefined,
			preferredLocale: undefined,
			preferredLocaleList: undefined
		}
		const { defaultLocale, locales, routing } = i18n
		return this.#i18nData = {
			currentLocale: computeCurrentLocale(renderContext.route.route, locales, routing, defaultLocale),
			preferredLocale: computePreferredLocale(request, locales),
			preferredLocaleList: computePreferredLocaleList(request, locales)
		}
	}
}
