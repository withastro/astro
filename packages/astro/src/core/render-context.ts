import colors from 'picocolors';
import { getActionContext } from '../actions/runtime/server.js';
import { deserializeActionResult } from '../actions/runtime/shared.js';
import type { ActionAPIContext } from '../actions/runtime/utils.js';
import { createCallAction, createGetActionResult, hasActionPayload } from '../actions/utils.js';
import {
	computeCurrentLocale,
	computePreferredLocale,
	computePreferredLocaleList,
} from '../i18n/utils.js';
import { renderEndpoint } from '../runtime/server/endpoint.js';
import { renderPage } from '../runtime/server/index.js';
import type { ComponentInstance } from '../types/astro.js';
import type { MiddlewareHandler, Props, RewritePayload } from '../types/public/common.js';
import type {
	APIContext,
	AstroGlobal,
	AstroGlobalPartial,
	AstroSharedContextCsp,
} from '../types/public/context.js';
import type { RouteData, SSRResult } from '../types/public/internal.js';
import type { SSRActions } from './app/types.js';
import {
	ASTRO_VERSION,
	clientAddressSymbol,
	REROUTE_DIRECTIVE_HEADER,
	REWRITE_DIRECTIVE_HEADER_KEY,
	REWRITE_DIRECTIVE_HEADER_VALUE,
	ROUTE_TYPE_HEADER,
	responseSentSymbol,
} from './constants.js';
import { AstroCookies, attachCookiesToResponse } from './cookies/index.js';
import { getCookiesFromResponse } from './cookies/response.js';
import { generateCspDigest } from './encryption.js';
import { CspNotEnabled, ForbiddenRewrite } from './errors/errors-data.js';
import { AstroError, AstroErrorData } from './errors/index.js';
import { callMiddleware } from './middleware/callMiddleware.js';
import { sequence } from './middleware/index.js';
import { renderRedirect } from './redirects/render.js';
import { getParams, getProps, type Pipeline, Slots } from './render/index.js';
import { isRoute404or500, isRouteExternalRedirect, isRouteServerIsland } from './routing/match.js';
import { copyRequest, getOriginPathname, setOriginPathname } from './routing/rewrite.js';
import { AstroSession } from './session.js';

export const apiContextRoutesSymbol = Symbol.for('context.routes');
/**
 * Each request is rendered using a `RenderContext`.
 * It contains data unique to each request. It is responsible for executing middleware, calling endpoints, and rendering the page by gathering necessary data from a `Pipeline`.
 */
export class RenderContext {
	private constructor(
		readonly pipeline: Pipeline,
		public locals: App.Locals,
		readonly middleware: MiddlewareHandler,
		readonly actions: SSRActions,
		// It must be a DECODED pathname
		public pathname: string,
		public request: Request,
		public routeData: RouteData,
		public status: number,
		public clientAddress: string | undefined,
		protected cookies = new AstroCookies(request),
		public params = getParams(routeData, pathname),
		protected url = new URL(request.url),
		public props: Props = {},
		public partial: undefined | boolean = undefined,
		public shouldInjectCspMetaTags = !!pipeline.manifest.csp,
		public session: AstroSession | undefined = pipeline.manifest.sessionConfig
			? new AstroSession(cookies, pipeline.manifest.sessionConfig, pipeline.runtimeMode)
			: undefined,
	) {}

	/**
	 * A flag that tells the render content if the rewriting was triggered
	 */
	isRewriting = false;
	/**
	 * A safety net in case of loops
	 */
	counter = 0;

	result: SSRResult | undefined = undefined;

	static async create({
		locals = {},
		middleware,
		pathname,
		pipeline,
		request,
		routeData,
		clientAddress,
		status = 200,
		props,
		partial = undefined,
		actions,
		shouldInjectCspMetaTags,
	}: Pick<RenderContext, 'pathname' | 'pipeline' | 'request' | 'routeData' | 'clientAddress'> &
		Partial<
			Pick<
				RenderContext,
				| 'locals'
				| 'middleware'
				| 'status'
				| 'props'
				| 'partial'
				| 'actions'
				| 'shouldInjectCspMetaTags'
			>
		>): Promise<RenderContext> {
		const pipelineMiddleware = await pipeline.getMiddleware();
		const pipelineActions = actions ?? (await pipeline.getActions());
		setOriginPathname(
			request,
			pathname,
			pipeline.manifest.trailingSlash,
			pipeline.manifest.buildFormat,
		);
		return new RenderContext(
			pipeline,
			locals,
			sequence(...pipeline.internalMiddleware, middleware ?? pipelineMiddleware),
			pipelineActions,
			pathname,
			request,
			routeData,
			status,
			clientAddress,
			undefined,
			undefined,
			undefined,
			props,
			partial,
			shouldInjectCspMetaTags ?? !!pipeline.manifest.csp,
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
	async render(
		componentInstance: ComponentInstance | undefined,
		slots: Record<string, any> = {},
	): Promise<Response> {
		const { middleware, pipeline } = this;
		const { logger, serverLike, streaming, manifest } = pipeline;

		const props =
			Object.keys(this.props).length > 0
				? this.props
				: await getProps({
						mod: componentInstance,
						routeData: this.routeData,
						routeCache: this.pipeline.routeCache,
						pathname: this.pathname,
						logger,
						serverLike,
						base: manifest.base,
					});
		const actionApiContext = this.createActionAPIContext();
		const apiContext = this.createAPIContext(props, actionApiContext);

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
				const oldPathname = this.pathname;
				pipeline.logger.debug('router', 'Called rewriting to:', payload);
				// we intentionally let the error bubble up
				const {
					routeData,
					componentInstance: newComponent,
					pathname,
					newUrl,
				} = await pipeline.tryRewrite(payload, this.request);

				// This is a case where the user tries to rewrite from a SSR route to a prerendered route (SSG).
				// This case isn't valid because when building for SSR, the prerendered route disappears from the server output because it becomes an HTML file,
				// so Astro can't retrieve it from the emitted manifest.
				if (
					this.pipeline.serverLike === true &&
					this.routeData.prerender === false &&
					routeData.prerender === true
				) {
					throw new AstroError({
						...ForbiddenRewrite,
						message: ForbiddenRewrite.message(this.pathname, pathname, routeData.component),
						hint: ForbiddenRewrite.hint(routeData.component),
					});
				}

				this.routeData = routeData;
				componentInstance = newComponent;
				if (payload instanceof Request) {
					this.request = payload;
				} else {
					this.request = copyRequest(
						newUrl,
						this.request,
						// need to send the flag of the previous routeData
						routeData.prerender,
						this.pipeline.logger,
						this.routeData.route,
					);
				}
				this.isRewriting = true;
				this.url = new URL(this.request.url);
				this.params = getParams(routeData, pathname);
				this.pathname = pathname;
				this.status = 200;
				setOriginPathname(
					this.request,
					oldPathname,
					this.pipeline.manifest.trailingSlash,
					this.pipeline.manifest.buildFormat,
				);
			}
			let response: Response;

			if (!ctx.isPrerendered) {
				const { action, setActionResult, serializeActionResult } = getActionContext(ctx);

				if (action?.calledFrom === 'form') {
					const actionResult = await action.handler();
					setActionResult(action.name, serializeActionResult(actionResult));
				}
			}

			switch (this.routeData.type) {
				case 'endpoint': {
					response = await renderEndpoint(
						componentInstance as any,
						ctx,
						this.routeData.prerender,
						logger,
					);
					break;
				}
				case 'redirect':
					return renderRedirect(this);
				case 'page': {
					this.result = await this.createResult(componentInstance!, actionApiContext);
					try {
						response = await renderPage(
							this.result,
							componentInstance?.default as any,
							props,
							slots,
							streaming,
							this.routeData,
						);
					} catch (e) {
						// If there is an error in the page's frontmatter or instantiation of the RenderTemplate fails midway,
						// we signal to the rest of the internals that we can ignore the results of existing renders and avoid kicking off more of them.
						this.result.cancelled = true;
						throw e;
					}

					// Signal to the i18n middleware to maybe act on this response
					response.headers.set(ROUTE_TYPE_HEADER, 'page');
					// Signal to the error-page-rerouting infra to let this response pass through to avoid loops
					if (this.routeData.route === '/404' || this.routeData.route === '/500') {
						response.headers.set(REROUTE_DIRECTIVE_HEADER, 'no');
					}
					if (this.isRewriting) {
						response.headers.set(REWRITE_DIRECTIVE_HEADER_KEY, REWRITE_DIRECTIVE_HEADER_VALUE);
					}
					break;
				}
				case 'fallback': {
					return new Response(null, { status: 500, headers: { [ROUTE_TYPE_HEADER]: 'fallback' } });
				}
			}
			// We need to merge the cookies from the response back into this.cookies
			// because they may need to be passed along from a rewrite.
			const responseCookies = getCookiesFromResponse(response);
			if (responseCookies) {
				this.cookies.merge(responseCookies);
			}
			return response;
		};

		// If we are rendering an extrnal redirect, we don't need go through the middleware,
		// otherwise Astro will attempt to render the external website
		if (isRouteExternalRedirect(this.routeData)) {
			return renderRedirect(this);
		}

		const response = await callMiddleware(middleware, apiContext, lastNext);
		if (response.headers.get(ROUTE_TYPE_HEADER)) {
			response.headers.delete(ROUTE_TYPE_HEADER);
		}
		// LEGACY: we put cookies on the response object,
		// where the adapter might be expecting to read it.
		// New code should be using `app.render({ addCookieHeader: true })` instead.
		attachCookiesToResponse(response, this.cookies);
		return response;
	}

	createAPIContext(props: APIContext['props'], context: ActionAPIContext): APIContext {
		const redirect = (path: string, status = 302) =>
			new Response(null, { status, headers: { Location: path } });

		Reflect.set(context, apiContextRoutesSymbol, this.pipeline);

		return Object.assign(context, {
			props,
			redirect,
			getActionResult: createGetActionResult(context.locals),
			callAction: createCallAction(context),
		});
	}

	async #executeRewrite(reroutePayload: RewritePayload) {
		this.pipeline.logger.debug('router', 'Calling rewrite: ', reroutePayload);
		const oldPathname = this.pathname;
		const { routeData, componentInstance, newUrl, pathname } = await this.pipeline.tryRewrite(
			reroutePayload,
			this.request,
		);
		// This is a case where the user tries to rewrite from a SSR route to a prerendered route (SSG).
		// This case isn't valid because when building for SSR, the prerendered route disappears from the server output because it becomes an HTML file,
		// so Astro can't retrieve it from the emitted manifest.
		// Allow i18n fallback rewrites - if the target route has fallback routes, this is likely an i18n scenario
		const isI18nFallback = routeData.fallbackRoutes && routeData.fallbackRoutes.length > 0;
		if (
			this.pipeline.serverLike &&
			!this.routeData.prerender &&
			routeData.prerender &&
			!isI18nFallback
		) {
			throw new AstroError({
				...ForbiddenRewrite,
				message: ForbiddenRewrite.message(this.pathname, pathname, routeData.component),
				hint: ForbiddenRewrite.hint(routeData.component),
			});
		}

		this.routeData = routeData;
		if (reroutePayload instanceof Request) {
			this.request = reroutePayload;
		} else {
			this.request = copyRequest(
				newUrl,
				this.request,
				// need to send the flag of the previous routeData
				routeData.prerender,
				this.pipeline.logger,
				this.routeData.route,
			);
		}
		this.url = new URL(this.request.url);
		const newCookies = new AstroCookies(this.request);
		if (this.cookies) {
			newCookies.merge(this.cookies);
		}
		this.cookies = newCookies;
		this.params = getParams(routeData, pathname);
		this.pathname = pathname;
		this.isRewriting = true;
		// we found a route and a component, we can change the status code to 200
		this.status = 200;
		setOriginPathname(
			this.request,
			oldPathname,
			this.pipeline.manifest.trailingSlash,
			this.pipeline.manifest.buildFormat,
		);
		return await this.render(componentInstance);
	}

	createActionAPIContext(): ActionAPIContext {
		const renderContext = this;
		const { params, pipeline, url } = this;
		const generator = `Astro v${ASTRO_VERSION}`;

		const rewrite = async (reroutePayload: RewritePayload) => {
			return await this.#executeRewrite(reroutePayload);
		};

		return {
			// Don't allow reassignment of cookies because it doesn't work
			get cookies() {
				return renderContext.cookies;
			},
			routePattern: this.routeData.route,
			isPrerendered: this.routeData.prerender,
			get clientAddress() {
				return renderContext.getClientAddress();
			},
			get currentLocale() {
				return renderContext.computeCurrentLocale();
			},
			generator,
			get locals() {
				return renderContext.locals;
			},
			set locals(_) {
				throw new AstroError(AstroErrorData.LocalsReassigned);
			},
			params,
			get preferredLocale() {
				return renderContext.computePreferredLocale();
			},
			get preferredLocaleList() {
				return renderContext.computePreferredLocaleList();
			},
			rewrite,
			request: this.request,
			site: pipeline.site,
			url,
			get originPathname() {
				return getOriginPathname(renderContext.request);
			},
			get session() {
				if (this.isPrerendered) {
					pipeline.logger.warn(
						'session',
						`context.session was used when rendering the route ${colors.green(this.routePattern)}, but it is not available on prerendered routes. If you need access to sessions, make sure that the route is server-rendered using \`export const prerender = false;\` or by setting \`output\` to \`"server"\` in your Astro config to make all your routes server-rendered by default. For more information, see https://docs.astro.build/en/guides/sessions/`,
					);
					return undefined;
				}
				if (!renderContext.session) {
					pipeline.logger.warn(
						'session',
						`context.session was used when rendering the route ${colors.green(this.routePattern)}, but no storage configuration was provided. Either configure the storage manually or use an adapter that provides session storage. For more information, see https://docs.astro.build/en/guides/sessions/`,
					);
					return undefined;
				}
				return renderContext.session;
			},
			get csp(): AstroSharedContextCsp {
				return {
					insertDirective(payload) {
						if (!pipeline.manifest.csp) {
							throw new AstroError(CspNotEnabled);
						}
						renderContext.result?.directives.push(payload);
					},

					insertScriptResource(resource) {
						if (!pipeline.manifest.csp) {
							throw new AstroError(CspNotEnabled);
						}
						renderContext.result?.scriptResources.push(resource);
					},
					insertStyleResource(resource) {
						if (!pipeline.manifest.csp) {
							throw new AstroError(CspNotEnabled);
						}

						renderContext.result?.styleResources.push(resource);
					},
					insertStyleHash(hash) {
						if (!pipeline.manifest.csp) {
							throw new AstroError(CspNotEnabled);
						}
						renderContext.result?.styleHashes.push(hash);
					},
					insertScriptHash(hash) {
						if (!pipeline.manifest.csp) {
							throw new AstroError(CspNotEnabled);
						}
						renderContext.result?.scriptHashes.push(hash);
					},
				};
			},
		};
	}

	async createResult(mod: ComponentInstance, ctx: ActionAPIContext): Promise<SSRResult> {
		const { cookies, pathname, pipeline, routeData, status } = this;
		const { clientDirectives, inlinedScripts, compressHTML, manifest, renderers, resolve } =
			pipeline;
		const { links, scripts, styles } = await pipeline.headElements(routeData);

		const extraStyleHashes = [];
		const extraScriptHashes = [];
		const shouldInjectCspMetaTags = this.shouldInjectCspMetaTags;
		const cspAlgorithm = manifest.csp?.algorithm ?? 'SHA-256';
		if (shouldInjectCspMetaTags) {
			for (const style of styles) {
				extraStyleHashes.push(await generateCspDigest(style.children, cspAlgorithm));
			}

			for (const script of scripts) {
				extraScriptHashes.push(await generateCspDigest(script.children, cspAlgorithm));
			}
		}

		const componentMetadata =
			(await pipeline.componentMetadata(routeData)) ?? manifest.componentMetadata;
		const headers = new Headers({ 'Content-Type': 'text/html' });
		const partial = typeof this.partial === 'boolean' ? this.partial : Boolean(mod.partial);
		const actionResult = hasActionPayload(this.locals)
			? deserializeActionResult(this.locals._actionPayload.actionResult)
			: undefined;
		const response = {
			status: actionResult?.error ? actionResult?.error.status : status,
			statusText: actionResult?.error ? actionResult?.error.type : 'OK',
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
			base: manifest.base,
			userAssetsBase: manifest.userAssetsBase,
			cancelled: false,
			clientDirectives,
			inlinedScripts,
			componentMetadata,
			compressHTML,
			cookies,
			/** This function returns the `Astro` faux-global */
			createAstro: (astroGlobal, props, slots) =>
				this.createAstro(result, astroGlobal, props, slots, ctx),
			links,
			params: this.params,
			partial,
			pathname,
			renderers,
			resolve,
			response,
			request: this.request,
			scripts,
			styles,
			actionResult,
			serverIslandNameMap: manifest.serverIslandNameMap ?? new Map(),
			key: manifest.key,
			trailingSlash: manifest.trailingSlash,
			_metadata: {
				hasHydrationScript: false,
				rendererSpecificHydrationScripts: new Set(),
				hasRenderedHead: false,
				renderedScripts: new Set(),
				hasDirectives: new Set(),
				hasRenderedServerIslandRuntime: false,
				headInTree: false,
				extraHead: [],
				extraStyleHashes,
				extraScriptHashes,
				propagators: new Set(),
			},
			cspDestination: manifest.csp?.cspDestination ?? (routeData.prerender ? 'meta' : 'header'),
			shouldInjectCspMetaTags,
			cspAlgorithm,
			// The following arrays must be cloned, otherwise they become mutable across routes.
			scriptHashes: manifest.csp?.scriptHashes ? [...manifest.csp.scriptHashes] : [],
			scriptResources: manifest.csp?.scriptResources ? [...manifest.csp.scriptResources] : [],
			styleHashes: manifest.csp?.styleHashes ? [...manifest.csp.styleHashes] : [],
			styleResources: manifest.csp?.styleResources ? [...manifest.csp.styleResources] : [],
			directives: manifest.csp?.directives ? [...manifest.csp.directives] : [],
			isStrictDynamic: manifest.csp?.isStrictDynamic ?? false,
			internalFetchHeaders: manifest.internalFetchHeaders,
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
		slotValues: Record<string, any> | null,
		apiContext: ActionAPIContext,
	): AstroGlobal {
		let astroPagePartial;
		// During rewriting, we must recompute the Astro global, because we need to purge the previous params/props/etc.
		if (this.isRewriting) {
			astroPagePartial = this.#astroPagePartial = this.createAstroPagePartial(
				result,
				astroStaticPartial,
				apiContext,
			);
		} else {
			// Create page partial with static partial so they can be cached together.
			astroPagePartial = this.#astroPagePartial ??= this.createAstroPagePartial(
				result,
				astroStaticPartial,
				apiContext,
			);
		}
		// Create component-level partials. `Astro.self` is added by the compiler.
		const astroComponentPartial = { props, self: null };

		// Create final object. `Astro.slots` will be lazily created.
		const Astro: Omit<AstroGlobal, 'self' | 'slots'> = Object.assign(
			Object.create(astroPagePartial),
			astroComponentPartial,
		);

		// Handle `Astro.slots`
		let _slots: AstroGlobal['slots'];
		Object.defineProperty(Astro, 'slots', {
			get: () => {
				if (!_slots) {
					_slots = new Slots(
						result,
						slotValues,
						this.pipeline.logger,
					) as unknown as AstroGlobal['slots'];
				}
				return _slots;
			},
		});

		return Astro as AstroGlobal;
	}

	createAstroPagePartial(
		result: SSRResult,
		astroStaticPartial: AstroGlobalPartial,
		apiContext: ActionAPIContext,
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
			return await this.#executeRewrite(reroutePayload);
		};

		const callAction = createCallAction(apiContext);

		return {
			generator: astroStaticPartial.generator,
			glob: astroStaticPartial.glob,
			routePattern: this.routeData.route,
			isPrerendered: this.routeData.prerender,
			cookies,
			get session() {
				if (this.isPrerendered) {
					pipeline.logger.warn(
						'session',
						`Astro.session was used when rendering the route ${colors.green(this.routePattern)}, but it is not available on prerendered pages. If you need access to sessions, make sure that the page is server-rendered using \`export const prerender = false;\` or by setting \`output\` to \`"server"\` in your Astro config to make all your pages server-rendered by default. For more information, see https://docs.astro.build/en/guides/sessions/`,
					);
					return undefined;
				}
				if (!renderContext.session) {
					pipeline.logger.warn(
						'session',
						`Astro.session was used when rendering the route ${colors.green(this.routePattern)}, but no storage configuration was provided. Either configure the storage manually or use an adapter that provides session storage. For more information, see https://docs.astro.build/en/guides/sessions/`,
					);
					return undefined;
				}
				return renderContext.session;
			},
			get clientAddress() {
				return renderContext.getClientAddress();
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
			response,
			site: pipeline.site,
			getActionResult: createGetActionResult(locals),
			get callAction() {
				return callAction;
			},
			url,
			get originPathname() {
				return getOriginPathname(renderContext.request);
			},
			get csp(): AstroSharedContextCsp {
				return {
					insertDirective(payload) {
						if (!pipeline.manifest.csp) {
							throw new AstroError(CspNotEnabled);
						}
						renderContext.result?.directives.push(payload);
					},

					insertScriptResource(resource) {
						if (!pipeline.manifest.csp) {
							throw new AstroError(CspNotEnabled);
						}
						renderContext.result?.scriptResources.push(resource);
					},
					insertStyleResource(resource) {
						if (!pipeline.manifest.csp) {
							throw new AstroError(CspNotEnabled);
						}

						renderContext.result?.styleResources.push(resource);
					},
					insertStyleHash(hash) {
						if (!pipeline.manifest.csp) {
							throw new AstroError(CspNotEnabled);
						}
						renderContext.result?.styleHashes.push(hash);
					},
					insertScriptHash(hash) {
						if (!pipeline.manifest.csp) {
							throw new AstroError(CspNotEnabled);
						}
						renderContext.result?.scriptHashes.push(hash);
					},
				};
			},
		};
	}

	getClientAddress() {
		const { pipeline, request, routeData, clientAddress } = this;

		if (routeData.prerender) {
			throw new AstroError({
				...AstroErrorData.PrerenderClientAddressNotAvailable,
				message: AstroErrorData.PrerenderClientAddressNotAvailable.message(routeData.component),
			});
		}

		if (clientAddress) {
			return clientAddress;
		}

		// TODO: Legacy, should not need to get here.
		// Some adapters set this symbol so we can't remove support yet.
		// Adapters should be updated to provide it via RenderOptions instead.
		if (clientAddressSymbol in request) {
			return Reflect.get(request, clientAddressSymbol) as string;
		}

		if (pipeline.adapterName) {
			throw new AstroError({
				...AstroErrorData.ClientAddressNotAvailable,
				message: AstroErrorData.ClientAddressNotAvailable.message(pipeline.adapterName),
			});
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

		if (this.#currentLocale) {
			return this.#currentLocale;
		}

		let computedLocale;
		if (isRouteServerIsland(routeData)) {
			let referer = this.request.headers.get('referer');
			if (referer) {
				if (URL.canParse(referer)) {
					referer = new URL(referer).pathname;
				}
				computedLocale = computeCurrentLocale(referer, locales, defaultLocale);
			}
		} else {
			// For SSG we match the route naively, for dev we handle fallback on 404, for SSR we find route from fallbackRoutes
			let pathname = routeData.pathname;
			if (!routeData.pattern.test(url.pathname)) {
				for (const fallbackRoute of routeData.fallbackRoutes) {
					if (fallbackRoute.pattern.test(url.pathname)) {
						pathname = fallbackRoute.pathname;
						break;
					}
				}
			}
			pathname = pathname && !isRoute404or500(routeData) ? pathname : url.pathname;
			computedLocale = computeCurrentLocale(pathname, locales, defaultLocale);
		}

		this.#currentLocale = computedLocale ?? fallbackTo;

		return this.#currentLocale;
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
