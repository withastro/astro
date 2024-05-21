import type {
	APIContext,
	AstroGlobal,
	AstroGlobalPartial,
	ComponentInstance,
	MiddlewareHandler,
	RewritePayload,
	RouteData,
	SSRResult,
} from '../@types/astro.js';
import type { ActionAPIContext } from '../actions/runtime/store.js';
import { createGetActionResult } from '../actions/utils.js';
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

/**
 * Each request is rendered using a `RenderContext`.
 * It contains data unique to each request. It is responsible for executing middleware, calling endpoints, and rendering the page by gathering necessary data from a `Pipeline`.
 */
export class RenderContext {
	private constructor(
		readonly pipeline: Pipeline,
		public locals: App.Locals,
		readonly middleware: MiddlewareHandler,
		readonly pathname: string,
		public request: Request,
		public routeData: RouteData,
		public status: number,
		protected cookies = new AstroCookies(request),
		public params = getParams(routeData, pathname),
		protected url = new URL(request.url)
	) {}

	/**
	 * A flag that tells the render content if the rewriting was triggered
	 */
	isRewriting = false;
	/**
	 * A safety net in case of loops
	 */
	counter = 0;

	static create({
		locals = {},
		middleware,
		pathname,
		pipeline,
		request,
		routeData,
		status = 200,
	}: Pick<RenderContext, 'pathname' | 'pipeline' | 'request' | 'routeData'> &
		Partial<Pick<RenderContext, 'locals' | 'middleware' | 'status'>>): RenderContext {
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
		const { cookies, middleware, pathname, pipeline } = this;
		const { logger, routeCache, serverLike, streaming } = pipeline;
		const props = await getProps({
			mod: componentInstance,
			routeData: this.routeData,
			routeCache,
			pathname,
			logger,
			serverLike,
		});
		const apiContext = this.createAPIContext(props);

		this.counter++;
		if (this.counter === 4) {
			return new Response('Loop Detected', {
				// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/508
				status: 508,
				statusText:
					'Astro detected a loop where you tried to call the rewriting logic more than four times.',
			});
		}
		const lastNext = async (ctx: APIContext, payload?: RewritePayload) => {
			if (payload) {
				if (this.pipeline.manifest.rewritingEnabled) {
					try {
						const [routeData, component] = await pipeline.tryRewrite(payload, this.request);
						this.routeData = routeData;
						componentInstance = component;
					} catch (e) {
						return new Response('Not found', {
							status: 404,
							statusText: 'Not found',
						});
					} finally {
						this.isRewriting = true;
					}
				} else {
					this.pipeline.logger.warn(
						'router',
						'The rewrite API is experimental. To use this feature, add the `rewriting` flag to the `experimental` object in your Astro config.'
					);
				}
			}
			switch (this.routeData.type) {
				case 'endpoint':
					return renderEndpoint(componentInstance as any, ctx, serverLike, logger);
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
							this.routeData
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
					if (
						this.routeData.route === '/404' ||
						this.routeData.route === '/500' ||
						this.isRewriting
					) {
						response.headers.set(REROUTE_DIRECTIVE_HEADER, 'no');
					}
					return response;
				}
				case 'fallback': {
					return new Response(null, { status: 500, headers: { [ROUTE_TYPE_HEADER]: 'fallback' } });
				}
			}
		};

		const response = await callMiddleware(
			middleware,
			apiContext,
			lastNext,
			this.pipeline.manifest.rewritingEnabled,
			this.pipeline.logger
		);
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
		const context = this.createActionAPIContext();
		return Object.assign(context, {
			props,
			getActionResult: createGetActionResult(context.locals),
		});
	}

	createActionAPIContext(): ActionAPIContext {
		const renderContext = this;
		const { cookies, params, pipeline, url } = this;
		const generator = `Astro v${ASTRO_VERSION}`;
		const redirect = (path: string, status = 302) =>
			new Response(null, { status, headers: { Location: path } });

		const rewrite = async (reroutePayload: RewritePayload) => {
			pipeline.logger.debug('router', 'Called rewriting to:', reroutePayload);
			try {
				const [routeData, component] = await pipeline.tryRewrite(reroutePayload, this.request);
				this.routeData = routeData;
				if (reroutePayload instanceof Request) {
					this.request = reroutePayload;
				} else {
					this.request = new Request(
						new URL(routeData.pathname ?? routeData.route, this.url.origin),
						this.request
					);
				}
				this.url = new URL(this.request.url);
				this.cookies = new AstroCookies(this.request);
				this.params = getParams(routeData, url.toString());
				this.isRewriting = true;
				return await this.render(component);
			} catch (e) {
				pipeline.logger.debug('router', 'Rewrite failed.', e);
				return new Response('Not found', {
					status: 404,
					statusText: 'Not found',
				});
			}
		};

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
					Reflect.set(this.request, clientLocalsSymbol, val);
				}
			},
			params,
			get preferredLocale() {
				return renderContext.computePreferredLocale();
			},
			get preferredLocaleList() {
				return renderContext.computePreferredLocaleList();
			},
			redirect,
			rewrite,
			request: this.request,
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

	#astroPagePartial?: Omit<AstroGlobal, 'props' | 'self' | 'slots'>;
	/**
	 * The Astro global is sourced in 3 different phases:
	 * - **Static**: `.generator` and `.glob` is printed by the compiler, instantiated once per process per astro file
	 * - **Page-level**: `.request`, `.cookies`, `.locals` etc. These remain the same for the duration of the request.
	 * - **Component-level**: `.props`, `.slots`, and `.self` are unique to each _use_ of each component.
	 *
	 * The page level partial is used as the prototype of the user-visible `Astro` global object, which is instantiated once per use of a component.
	 */
	createAstro(
		result: SSRResult,
		astroStaticPartial: AstroGlobalPartial,
		props: Record<string, any>,
		slotValues: Record<string, any> | null
	): AstroGlobal {
		// Create page partial with static partial so they can be cached together.
		const astroPagePartial = (this.#astroPagePartial ??= this.createAstroPagePartial(
			result,
			astroStaticPartial
		));
		// Create component-level partials. `Astro.self` is added by the compiler.
		const astroComponentPartial = { props, self: null };

		// Create final object. `Astro.slots` will be lazily created.
		const Astro: Omit<AstroGlobal, 'self' | 'slots'> = Object.assign(
			Object.create(astroPagePartial),
			astroComponentPartial
		);

		// Handle `Astro.slots`
		let _slots: AstroGlobal['slots'];
		Object.defineProperty(Astro, 'slots', {
			get: () => {
				if (!_slots) {
					_slots = new Slots(
						result,
						slotValues,
						this.pipeline.logger
					) as unknown as AstroGlobal['slots'];
				}
				return _slots;
			},
		});

		return Astro as AstroGlobal;
	}

	createAstroPagePartial(
		result: SSRResult,
		astroStaticPartial: AstroGlobalPartial
	): Omit<AstroGlobal, 'props' | 'self' | 'slots'> {
		const renderContext = this;
		const { cookies, locals, params, pipeline, url } = this;
		const { response } = result;
		const redirect = (path: string, status = 302) => {
			// If the response is already sent, error as we cannot proceed with the redirect.
			if ((this.request as any)[responseSentSymbol]) {
				throw new AstroError({
					...AstroErrorData.ResponseSentError,
				});
			}
			return new Response(null, { status, headers: { Location: path } });
		};

		const rewrite = async (reroutePayload: RewritePayload) => {
			try {
				pipeline.logger.debug('router', 'Calling rewrite: ', reroutePayload);
				const [routeData, component] = await pipeline.tryRewrite(reroutePayload, this.request);
				this.routeData = routeData;
				if (reroutePayload instanceof Request) {
					this.request = reroutePayload;
				} else {
					this.request = new Request(
						new URL(routeData.pathname ?? routeData.route, this.url.origin),
						this.request
					);
				}
				this.url = new URL(this.request.url);
				this.cookies = new AstroCookies(this.request);
				this.params = getParams(routeData, url.toString());
				this.isRewriting = true;
				return await this.render(component);
			} catch (e) {
				pipeline.logger.debug('router', 'Rerouting failed, returning a 404.', e);
				return new Response('Not found', {
					status: 404,
					statusText: 'Not found',
				});
			}
		};

		return {
			generator: astroStaticPartial.generator,
			glob: astroStaticPartial.glob,
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
			locals,
			redirect,
			rewrite,
			request: this.request,
			getActionResult: createGetActionResult(locals),
			response,
			site: pipeline.site,
			url,
		};
	}

	clientAddress() {
		const { pipeline, request } = this;
		if (clientAddressSymbol in request) {
			return Reflect.get(request, clientAddressSymbol) as string;
		}

		if (pipeline.serverLike) {
			if (request.body === null) {
				throw new AstroError(AstroErrorData.PrerenderClientAddressNotAvailable);
			}

			if (pipeline.adapterName) {
				throw new AstroError({
					...AstroErrorData.ClientAddressNotAvailable,
					message: AstroErrorData.ClientAddressNotAvailable.message(pipeline.adapterName),
				});
			}
		}

		throw new AstroError(AstroErrorData.StaticClientAddressNotAvailable);
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
