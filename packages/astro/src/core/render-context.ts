import type { APIContext, AstroGlobal, AstroGlobalPartial, ComponentInstance, MiddlewareHandler, RouteData, SSRResult } from '../@types/astro.js';
import { renderEndpoint } from '../runtime/server/endpoint.js';
import { renderPage } from '../runtime/server/index.js';
import { renderRedirect } from './redirects/render.js';
import { attachCookiesToResponse } from './cookies/index.js';
import { sequence } from './middleware/index.js';
import { AstroCookies } from './cookies/index.js';
import { ASTRO_VERSION, ROUTE_TYPE_HEADER, clientAddressSymbol, clientLocalsSymbol, responseSentSymbol } from './constants.js';
import { getParams, getProps, type Pipeline, Slots } from './render/index.js';
import { AstroError, AstroErrorData } from './errors/index.js';
import {
	computeCurrentLocale,
	computePreferredLocale,
	computePreferredLocaleList,
} from '../i18n/utils.js';

export class RenderContext {
	private constructor(
		readonly pipeline: Pipeline,
		public locals: App.Locals,
		readonly middleware: MiddlewareHandler,
		readonly pathname: string,
		readonly request: Request,
		readonly routeData: RouteData,
		public status: number,
		readonly cookies = new AstroCookies(request),
		readonly params = getParams(routeData, pathname),
		readonly url = new URL(request.url)
	) {}

	static create({
		locals = {},
		middleware,
		pathname,
		pipeline,
		request,
		routeData,
		status = 200,
	}: Pick<RenderContext, 'pathname' | 'pipeline' | 'request' | 'routeData'> &
		Partial<Pick<RenderContext, 'locals' | 'middleware' | 'status'>>) {
		return new RenderContext(
			pipeline,
			locals,
			sequence(...pipeline.internalMiddleware, middleware ?? pipeline.middleware),
			pathname,
			request,
			routeData,
			status
		);
	}

	/**
	 * The main function of the RenderContext.
	 *
	 * Use this function to render any route known to Astro.
	 * It attempts to render a route. A route can be a:
	 *
	 * - page
	 * - redirect
	 * - endpoint
	 * - fallback
	 */
	async render(componentInstance: ComponentInstance | undefined): Promise<Response> {
		const { cookies, middleware, pathname, pipeline, routeData } = this;
		const { logger, routeCache, serverLike, streaming } = pipeline;
		const props = await getProps({
			mod: componentInstance,
			routeData,
			routeCache,
			pathname,
			logger,
			serverLike,
		});
		const apiContext = this.createAPIContext(props);
		const { type } = routeData;

		const lastNext =
			type === 'endpoint'
				? () => renderEndpoint(componentInstance as any, apiContext, serverLike, logger)
				: type === 'redirect'
					? () => renderRedirect(this)
					: type === 'page'
						? async () => {
								const result = await this.createResult(componentInstance!);
								const response = await renderPage(
									result,
									componentInstance?.default as any,
									props,
									{},
									streaming,
									routeData
								);
								response.headers.set(ROUTE_TYPE_HEADER, 'page');
								return response;
							}
						: type === 'fallback'
							? async () =>
									new Response(null, { status: 500, headers: { [ROUTE_TYPE_HEADER]: 'fallback' } })
							: () => {
									throw new Error('Unknown type of route: ' + type);
								};

		const response = await middleware(apiContext, lastNext);
		
		if (!response || !(response instanceof Response)) {
			throw new AstroError(AstroErrorData.MiddlewareNotAResponse);
		}

		if (response.headers.get(ROUTE_TYPE_HEADER)) {
			response.headers.delete(ROUTE_TYPE_HEADER);
		}
		// LEGACY: we put cookies on the response object,
		// where the adapter might be expecting to read it.
		// New code should be using `app.render({ addCookieHeader: true })` instead.
		attachCookiesToResponse(response, cookies);
		return response;
	}

	createAPIContext(props: APIContext['props']): APIContext {
		const renderContext = this;
		const { cookies, i18nData, params, pipeline, request, url } = this;
		const { currentLocale, preferredLocale, preferredLocaleList } = i18nData;
		const generator = `Astro v${ASTRO_VERSION}`;
		const redirect = (path: string, status = 302) =>
			new Response(null, { status, headers: { Location: path } });
		const site = pipeline.site ? new URL(pipeline.site) : undefined;
		return {
			cookies,
			currentLocale,
			generator,
			params,
			preferredLocale,
			preferredLocaleList,
			props,
			redirect,
			request,
			site,
			url,
			get clientAddress() {
				if (clientAddressSymbol in request) {
					return Reflect.get(request, clientAddressSymbol) as string;
				}
				if (pipeline.adapterName) {
					throw new AstroError({
						...AstroErrorData.ClientAddressNotAvailable,
						message: AstroErrorData.ClientAddressNotAvailable.message(pipeline.adapterName),
					});
				} else {
					throw new AstroError(AstroErrorData.StaticClientAddressNotAvailable);
				}
			},
			get locals() {
				return renderContext.locals;
			},
			// TODO(breaking): disallow replacing the locals object
			set locals(val) {
				if (typeof val !== 'object') {
					throw new AstroError(AstroErrorData.LocalsNotAnObject);
				} else {
					renderContext.locals = val;
					// we also put it on the original Request object,
					// where the adapter might be expecting to read it after the response.
					Reflect.set(request, clientLocalsSymbol, val);
				}
			},
		};
	}

	async createResult(mod: ComponentInstance) {
		const { pathname, pipeline, routeData, status, url } = this;
		const { clientDirectives, compressHTML, renderers, site } = pipeline;
		const componentMetadata = await pipeline.componentMetadata(routeData);
		const { links, scripts, styles } = await pipeline.headElements(routeData);
		const headers = new Headers({ 'Content-Type': 'text/html' });
		const partial = Boolean(mod.partial);
		const response = { status, statusText: 'OK', headers } satisfies ResponseInit;

		// Disallow `Astro.response.headers = new Headers`
		Object.defineProperty(response, 'headers', {
			value: response.headers,
			enumerable: true,
			writable: false,
		});

		// Create the result object that will be passed into the renderPage function.
		// This object starts here as an empty shell (not yet the result) but then
		// calling the render() function will populate the object with scripts, styles, etc.
		const result: SSRResult = {
			clientDirectives,
			componentMetadata,
			compressHTML,
			/** This function returns the `Astro` faux-global */
			createAstro: (astroGlobal, props, slots) => this.createAstro(result, astroGlobal, props, slots),
			links,
			partial,
			pathname,
			renderers,
			resolve: (id) => pipeline.resolve(id),
			response,
			scripts,
			styles,
			url,
			_metadata: {
				hasHydrationScript: false,
				rendererSpecificHydrationScripts: new Set(),
				hasRenderedHead: false,
				hasDirectives: new Set(),
				headInTree: false,
				extraHead: [],
				propagators: new Set(),
			},
		};

		return result;
	}

	createAstro(
		result: SSRResult,
		astroStaticPartial: AstroGlobalPartial,
		props: Record<string, any>,
		slotValues: Record<string, any> | null
	): AstroGlobal {
		const { cookies, i18nData, locals, params, pipeline, request } = this
		const { currentLocale, preferredLocale, preferredLocaleList } = i18nData;
		const { response, url } = result;
		const redirect = (path: string, status = 302) => {
			// If the response is already sent, error as we cannot proceed with the redirect.
			if ((request as any)[responseSentSymbol]) {
				throw new AstroError({
					...AstroErrorData.ResponseSentError,
				});
			}
			return new Response(null, { status, headers: { Location: path } });
		}
		const slots = new Slots(result, slotValues, pipeline.logger) as unknown as AstroGlobal['slots'];
		const astroDynamicPartial: Omit<AstroGlobal, keyof AstroGlobalPartial | 'clientAddress' | 'self'> = { cookies, preferredLocale, preferredLocaleList, currentLocale, params, props, locals, redirect, request, response, slots, url };

		return {
			__proto__: astroStaticPartial,
			...astroDynamicPartial,
			get clientAddress() {
				if (clientAddressSymbol in request) {
					return Reflect.get(request, clientAddressSymbol) as string;
				}
				if (pipeline.adapterName) {
					throw new AstroError({
						...AstroErrorData.ClientAddressNotAvailable,
						message: AstroErrorData.ClientAddressNotAvailable.message(pipeline.adapterName),
					});
				} else {
					throw new AstroError(AstroErrorData.StaticClientAddressNotAvailable);
				}
			},
		// `Astro.self` is added by the compiler
		} as unknown as typeof astroStaticPartial & typeof astroDynamicPartial & Pick<AstroGlobal, 'clientAddress' | 'self'>
	}

	/**
	 * API Context may be created multiple times per request, i18n data needs to be computed only once.
	 * So, it is computed and saved here on creation of the first APIContext and reused for later ones.
	 */
	#i18nData?: Pick<APIContext, 'currentLocale' | 'preferredLocale' | 'preferredLocaleList'>;

	get i18nData() {
		if (this.#i18nData) return this.#i18nData
		const { pipeline: { i18n }, request, routeData, url } = this;
		if (!i18n) return {
			currentLocale: undefined,
			preferredLocale: undefined,
			preferredLocaleList: undefined
		}
		const { defaultLocale, locales, strategy } = i18n
		return (this.#i18nData = {
			// TODO: we are making two calls to computeCurrentLocale(). In various cases, one works and the other doesn't.
			// Ideally, we could use `renderContext.pathname` which is intended to be the one true "file-system-matchable" path.
			// - Arsh
			currentLocale: computeCurrentLocale(url.pathname, locales, strategy, defaultLocale) ?? computeCurrentLocale(routeData.route, locales, strategy, defaultLocale),
			preferredLocale: computePreferredLocale(request, locales),
			preferredLocaleList: computePreferredLocaleList(request, locales),
		});
	}
}