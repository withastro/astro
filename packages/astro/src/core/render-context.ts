import type {
	APIContext,
	ComponentInstance,
	MiddlewareHandler,
	RouteData,
} from '../@types/astro.js';
import { renderEndpoint } from '../runtime/server/endpoint.js';
import { attachCookiesToResponse } from './cookies/index.js';
import { callMiddleware } from './middleware/callMiddleware.js';
import { sequence } from './middleware/index.js';
import { AstroCookies } from './cookies/index.js';
import { createResult } from './render/index.js';
import { renderPage } from '../runtime/server/index.js';
import {
	ASTRO_VERSION,
	ROUTE_TYPE_HEADER,
	clientAddressSymbol,
	clientLocalsSymbol,
} from './constants.js';
import { getParams, getProps, type Pipeline } from './render/index.js';
import { AstroError, AstroErrorData } from './errors/index.js';
import {
	computeCurrentLocale,
	computePreferredLocale,
	computePreferredLocaleList,
} from '../i18n/utils.js';
import { renderRedirect } from './redirects/render.js';

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
							? () =>
									new Response(null, { status: 500, headers: { [ROUTE_TYPE_HEADER]: 'fallback' } })
							: () => {
									throw new Error('Unknown type of route: ' + type);
								};

		const response = await callMiddleware(middleware, apiContext, lastNext);
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
		const { cookies, params, pipeline, request, url } = this;
		const generator = `Astro v${ASTRO_VERSION}`;
		const redirect = (path: string, status = 302) =>
			new Response(null, { status, headers: { Location: path } });
		const site = pipeline.site ? new URL(pipeline.site) : undefined;
		return {
			cookies,
			get currentLocale() {
				return renderContext.computeCurrentLocale();
			},
			generator,
			params,
			get preferredLocale() {
				return renderContext.computePreferredLocale();
			},
			get preferredLocaleList() {
				return renderContext.computePreferredLocaleList();
			},
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
		const { cookies, locals, params, pathname, pipeline, request, routeData, status } = this;
		const {
			adapterName,
			clientDirectives,
			compressHTML,
			i18n,
			manifest,
			logger,
			renderers,
			resolve,
			site,
			serverLike,
		} = pipeline;
		const { links, scripts, styles } = await pipeline.headElements(routeData);
		const componentMetadata =
			(await pipeline.componentMetadata(routeData)) ?? manifest.componentMetadata;
		const { defaultLocale, locales, strategy } = i18n ?? {};
		const partial = Boolean(mod.partial);
		return createResult({
			adapterName,
			clientDirectives,
			componentMetadata,
			compressHTML,
			cookies,
			defaultLocale,
			locales,
			locals,
			logger,
			links,
			params,
			partial,
			pathname,
			renderers,
			resolve,
			request,
			route: routeData.route,
			strategy,
			site,
			scripts,
			ssr: serverLike,
			status,
			styles,
		});
	}

	/**
	 * API Context may be created multiple times per request, i18n data needs to be computed only once.
	 * So, it is computed and saved here on creation of the first APIContext and reused for later ones.
	 */
	#currentLocale: APIContext['currentLocale'];
	computeCurrentLocale() {
		const {
			url,
			pipeline: { i18n },
			routeData,
		} = this;
		if (!i18n) return;
		const { defaultLocale, locales, strategy } = i18n;
		return (this.#currentLocale ??= computeCurrentLocale(
			routeData.route,
			locales,
			strategy,
			defaultLocale
		));
	}

	#preferredLocale: APIContext['preferredLocale'];
	computePreferredLocale() {
		const {
			pipeline: { i18n },
			request,
		} = this;
		if (!i18n) return;
		return (this.#preferredLocale ??= computePreferredLocale(request, i18n.locales));
	}

	#preferredLocaleList: APIContext['preferredLocaleList'];
	computePreferredLocaleList() {
		const {
			pipeline: { i18n },
			request,
		} = this;
		if (!i18n) return;
		return (this.#preferredLocaleList ??= computePreferredLocaleList(request, i18n.locales));
	}
}
