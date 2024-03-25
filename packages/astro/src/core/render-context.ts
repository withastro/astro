import type {
	APIContext,
	AstroGlobal,
	AstroGlobalPartial,
	ComponentInstance,
	MiddlewareHandler,
	RouteData,
	SSRResult,
} from '../@types/astro.js';
import {
	computeCurrentLocale,
	computePreferredLocale,
	computePreferredLocaleList,
} from '../i18n/utils.js';
import { renderEndpoint } from '../runtime/server/endpoint.js';
import { renderPage } from '../runtime/server/index.js';
import {
	ASTRO_VERSION,
	REROUTE_DIRECTIVE_HEADER,
	ROUTE_TYPE_HEADER,
	clientAddressSymbol,
	clientLocalsSymbol,
	responseSentSymbol,
} from './constants.js';
import { AstroCookies, attachCookiesToResponse } from './cookies/index.js';
import { AstroError, AstroErrorData } from './errors/index.js';
import { callMiddleware } from './middleware/callMiddleware.js';
import { sequence } from './middleware/index.js';
import { renderRedirect } from './redirects/render.js';
import { type Pipeline, Slots, getParams, getProps } from './render/index.js';

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

		const lastNext = async () => {
			switch (routeData.type) {
				case 'endpoint':
					return renderEndpoint(componentInstance as any, apiContext, serverLike, logger);
				case 'redirect':
					return renderRedirect(this);
				case 'page': {
					const result = await this.createResult(componentInstance!);
					let response: Response;
					try {
						response = await renderPage(
							result,
							componentInstance?.default as any,
							props,
							{},
							streaming,
							routeData
						);
					} catch (e) {
						// If there is an error in the page's frontmatter or instantiation of the RenderTemplate fails midway,
						// we signal to the rest of the internals that we can ignore the results of existing renders and avoid kicking off more of them.
						result.cancelled = true;
						throw e;
					}
					// Signal to the i18n middleware to maybe act on this response
					response.headers.set(ROUTE_TYPE_HEADER, 'page');
					// Signal to the error-page-rerouting infra to let this response pass through to avoid loops
					if (routeData.route === '/404' || routeData.route === '/500') {
						response.headers.set(REROUTE_DIRECTIVE_HEADER, 'no');
					}
					return response;
				}
				case 'fallback': {
					return new Response(null, { status: 500, headers: { [ROUTE_TYPE_HEADER]: 'fallback' } });
				}
			}
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
		return {
			cookies,
			get clientAddress() {
				return renderContext.clientAddress();
			},
			get currentLocale() {
				return renderContext.computeCurrentLocale();
			},
			generator,
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
			site: pipeline.site,
			url,
		};
	}

	async createResult(mod: ComponentInstance) {
		const { cookies, pathname, pipeline, routeData, status } = this;
		const { clientDirectives, inlinedScripts, compressHTML, manifest, renderers, resolve } =
			pipeline;
		const { links, scripts, styles } = await pipeline.headElements(routeData);
		const componentMetadata =
			(await pipeline.componentMetadata(routeData)) ?? manifest.componentMetadata;
		const headers = new Headers({ 'Content-Type': 'text/html' });
		const partial = Boolean(mod.partial);
		const response = {
			status,
			statusText: 'OK',
			get headers() {
				return headers;
			},
			// Disallow `Astro.response.headers = new Headers`
			set headers(_) {
				throw new AstroError(AstroErrorData.AstroResponseHeadersReassigned);
			},
		} satisfies AstroGlobal['response'];

		// Create the result object that will be passed into the renderPage function.
		// This object starts here as an empty shell (not yet the result) but then
		// calling the render() function will populate the object with scripts, styles, etc.
		const result: SSRResult = {
			cancelled: false,
			clientDirectives,
			inlinedScripts,
			componentMetadata,
			compressHTML,
			cookies,
			/** This function returns the `Astro` faux-global */
			createAstro: (astroGlobal, props, slots) =>
				this.createAstro(result, astroGlobal, props, slots),
			links,
			partial,
			pathname,
			renderers,
			resolve,
			response,
			scripts,
			styles,
			_metadata: {
				hasHydrationScript: false,
				rendererSpecificHydrationScripts: new Set(),
				hasRenderedHead: false,
				renderedScripts: new Set(),
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
		astroGlobalPartial: AstroGlobalPartial,
		props: Record<string, any>,
		slotValues: Record<string, any> | null
	): AstroGlobal {
		const renderContext = this;
		const { cookies, locals, params, pipeline, request, url } = this;
		const { response } = result;
		const redirect = (path: string, status = 302) => {
			// If the response is already sent, error as we cannot proceed with the redirect.
			if ((request as any)[responseSentSymbol]) {
				throw new AstroError({
					...AstroErrorData.ResponseSentError,
				});
			}
			return new Response(null, { status, headers: { Location: path } });
		};
		const slots = new Slots(result, slotValues, pipeline.logger) as unknown as AstroGlobal['slots'];

		// `Astro.self` is added by the compiler
		const astroGlobalCombined: Omit<AstroGlobal, 'self'> = {
			...astroGlobalPartial,
			cookies,
			get clientAddress() {
				return renderContext.clientAddress();
			},
			get currentLocale() {
				return renderContext.computeCurrentLocale();
			},
			params,
			get preferredLocale() {
				return renderContext.computePreferredLocale();
			},
			get preferredLocaleList() {
				return renderContext.computePreferredLocaleList();
			},
			props,
			locals,
			redirect,
			request,
			response,
			slots,
			site: pipeline.site,
			url,
		};

		return astroGlobalCombined as AstroGlobal;
	}

	clientAddress() {
		const { pipeline, request } = this;
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

		const fallbackTo =
			strategy === 'pathname-prefix-other-locales' || strategy === 'domains-prefix-other-locales'
				? defaultLocale
				: undefined;

		// TODO: look into why computeCurrentLocale() needs routeData.route to pass ctx.currentLocale tests,
		// and url.pathname to pass Astro.currentLocale tests.
		// A single call with `routeData.pathname ?? routeData.route` as the pathname still fails.
		return (this.#currentLocale ??=
			computeCurrentLocale(routeData.route, locales) ??
			computeCurrentLocale(url.pathname, locales) ??
			fallbackTo);
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
