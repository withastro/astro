import colors from 'piccolore';
import {
	collapseDuplicateLeadingSlashes,
	prependForwardSlash,
	removeTrailingForwardSlash,
} from '@astrojs/internal-helpers/path';
import { deserializeActionResult } from '../../actions/runtime/client.js';
import { createCallAction, createGetActionResult, hasActionPayload } from '../../actions/utils.js';
import { AstroCookies } from '../cookies/index.js';
import { Slots } from '../render/index.js';
import {
	ASTRO_GENERATOR,
	DEFAULT_404_COMPONENT,
	fetchStateSymbol,
	originPathnameSymbol,
	pipelineSymbol,
	responseSentSymbol,
} from '../constants.js';
import { pushDirective } from '../csp/runtime.js';
import { generateCspDigest } from '../encryption.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import {
	computeCurrentLocale as computeCurrentLocaleUtil,
	computeCurrentLocaleFromParams,
	computePreferredLocale as computePreferredLocaleUtil,
	computePreferredLocaleList as computePreferredLocaleListUtil,
} from '../../i18n/utils.js';
import { getParams, getProps } from '../render/index.js';
import { Rewrites } from '../rewrites/handler.js';
import { isRoute404or500, isRouteServerIsland } from '../routing/match.js';
import { normalizeUrl } from '../util/normalized-url.js';
import { getOriginPathname, setOriginPathname } from '../routing/rewrite.js';
import { routeHasHtmlExtension } from '../routing/helpers.js';
import { getRenderOptions } from '../app/render-options.js';
function getFetchStateFromAPIContext(context) {
	const state = context[fetchStateSymbol];
	if (!state) {
		throw new Error(
			"FetchState not found on APIContext. This is an internal error \u2014 the context was not created through Astro's request pipeline.",
		);
	}
	return state;
}
class FetchState {
	pipeline;
	/**
	 * The request to render. Mutated during rewrites so subsequent renders
	 * see the rewritten URL.
	 */
	request;
	routeData;
	/**
	 * The pathname to use for routing and rendering. Starts out as the raw,
	 * base-stripped, decoded pathname from the request. May be further
	 * normalized by `AstroHandler` after routeData is known (in dev, when
	 * the matched route has no `.html` extension, `.html` / `/index.html`
	 * suffixes are stripped).
	 */
	pathname;
	/** Resolved render options (addCookieHeader, clientAddress, locals, etc.). */
	renderOptions;
	/** When the request started, used to log duration. */
	timeStart;
	/**
	 * The route's loaded component module. Set before middleware runs; may
	 * be swapped during in-flight rewrites from inside the middleware chain.
	 */
	componentInstance;
	/**
	 * Slot overrides supplied by the container API. `undefined` for HTTP
	 * requests — `PagesHandler` coalesces to `{}` on read so we don't
	 * allocate an empty object per request.
	 */
	slots;
	/**
	 * Default HTTP status for the rendered response. Callers override
	 * before rendering runs (e.g. `AstroHandler` sets this from
	 * `BaseApp.getDefaultStatusCode`; error handlers set `404` / `500`).
	 */
	status = 200;
	/** Whether user middleware should be skipped for this request. */
	skipMiddleware = false;
	/** A flag that tells the render content if the rewriting was triggered. */
	isRewriting = false;
	/** A safety net in case of loops (rewrite counter). */
	counter = 0;
	/** Cookies for this request. Created lazily on first access. */
	cookies;
	/** Route params derived from routeData + pathname. Computed lazily. */
	#params;
	get params() {
		if (!this.#params && this.routeData) {
			this.#params = getParams(this.routeData, this.pathname);
		}
		return this.#params;
	}
	set params(value) {
		this.#params = value;
	}
	/** Normalized URL for this request. */
	url;
	/** Client address for this request. */
	clientAddress;
	/** Whether this is a partial render (container API). */
	partial;
	/** Whether to inject CSP meta tags. */
	shouldInjectCspMetaTags;
	/** Request-scoped locals object, shared with user middleware. */
	locals = {};
	/**
	 * Memoized `props` (see `getProps`). `null` means "not yet computed"
	 * — using `null` (rather than `undefined`) keeps the hidden class
	 * stable and distinct from a valid-but-empty result.
	 */
	props = null;
	/** Memoized `ActionAPIContext` (see `getActionAPIContext`). */
	actionApiContext = null;
	/** Memoized `APIContext` (see `getAPIContext`). */
	apiContext = null;
	/** Registered context providers keyed by name. Lazy-initialized on first provide(). */
	#providers;
	/** Cached values from resolved providers. Lazy-initialized on first resolve(). */
	#providersResolvedValues;
	/** Cached promise for lazy component instance loading. */
	#componentInstancePromise;
	/** SSR result for the current page render. */
	result;
	/** Initial props (from container/error handler). */
	initialProps = {};
	/** Rewrites handler instance. Lazy-initialized on first rewrite(). */
	#rewrites;
	/** Memoized Astro page partial. */
	#astroPagePartial;
	/** Memoized current locale. */
	#currentLocale;
	/** Memoized preferred locale. */
	#preferredLocale;
	/** Memoized preferred locale list. */
	#preferredLocaleList;
	constructor(pipeline, request, options) {
		this.pipeline = pipeline;
		this.request = request;
		options ??= getRenderOptions(request);
		this.routeData = options?.routeData;
		this.renderOptions = options ?? {
			addCookieHeader: false,
			clientAddress: void 0,
			locals: void 0,
			prerenderedErrorPageFetch: fetch,
			routeData: void 0,
			waitUntil: void 0,
		};
		this.componentInstance = void 0;
		this.slots = void 0;
		const url = new URL(request.url);
		this.pathname = this.#computePathname(url);
		this.timeStart = performance.now();
		this.clientAddress = options?.clientAddress;
		this.locals = options?.locals ?? {};
		this.url = normalizeUrl(url);
		this.cookies = new AstroCookies(request);
		if (!Reflect.get(request, originPathnameSymbol)) {
			setOriginPathname(
				request,
				this.pathname,
				pipeline.manifest.trailingSlash,
				pipeline.manifest.buildFormat,
			);
		}
		this.#resolveRouteData();
	}
	/**
	 * Triggers a rewrite. Delegates to the Rewrites handler.
	 */
	rewrite(payload) {
		return (this.#rewrites ??= new Rewrites()).execute(this, payload);
	}
	/**
	 * Creates the SSR result for the current page render.
	 */
	async createResult(mod, ctx) {
		const pipeline = this.pipeline;
		const { clientDirectives, inlinedScripts, compressHTML, manifest, renderers, resolve } =
			pipeline;
		const routeData = this.routeData;
		const { links, scripts, styles } = await pipeline.headElements(routeData);
		const extraStyleHashes = [];
		const extraScriptHashes = [];
		const shouldInjectCspMetaTags =
			this.shouldInjectCspMetaTags ?? manifest.shouldInjectCspMetaTags;
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
			: void 0;
		const status = this.status;
		const response = {
			status: actionResult?.error ? actionResult?.error.status : status,
			statusText: actionResult?.error ? actionResult?.error.type : 'OK',
			get headers() {
				return headers;
			},
			set headers(_) {
				throw new AstroError(AstroErrorData.AstroResponseHeadersReassigned);
			},
		};
		const state = this;
		const result = {
			base: manifest.base,
			userAssetsBase: manifest.userAssetsBase,
			cancelled: false,
			clientDirectives,
			inlinedScripts,
			componentMetadata,
			compressHTML,
			cookies: this.cookies,
			createAstro: (props, slots) => state.createAstro(result, props, slots, ctx),
			links,
			// SAFETY: createResult is only called after route resolution, so routeData
			// is always set and the params getter always returns a value.
			params: this.params,
			partial,
			pathname: this.pathname,
			renderers,
			resolve,
			response,
			request: this.request,
			scripts,
			styles,
			actionResult,
			async getServerIslandNameMap() {
				const serverIslands = await pipeline.getServerIslands();
				return serverIslands.serverIslandNameMap ?? /* @__PURE__ */ new Map();
			},
			key: manifest.key,
			trailingSlash: manifest.trailingSlash,
			_experimentalQueuedRendering: {
				pool: pipeline.nodePool,
				htmlStringCache: pipeline.htmlStringCache,
				enabled: manifest.experimentalQueuedRendering?.enabled,
				poolSize: manifest.experimentalQueuedRendering?.poolSize,
				contentCache: manifest.experimentalQueuedRendering?.contentCache,
			},
			_metadata: {
				hasHydrationScript: false,
				rendererSpecificHydrationScripts: /* @__PURE__ */ new Set(),
				hasRenderedHead: false,
				renderedScripts: /* @__PURE__ */ new Set(),
				hasDirectives: /* @__PURE__ */ new Set(),
				hasRenderedServerIslandRuntime: false,
				headInTree: false,
				extraHead: [],
				extraStyleHashes,
				extraScriptHashes,
				propagators: /* @__PURE__ */ new Set(),
				templateDepth: 0,
			},
			cspDestination: manifest.csp?.cspDestination ?? (routeData.prerender ? 'meta' : 'header'),
			shouldInjectCspMetaTags,
			cspAlgorithm,
			scriptHashes: manifest.csp?.scriptHashes ? [...manifest.csp.scriptHashes] : [],
			scriptResources: manifest.csp?.scriptResources ? [...manifest.csp.scriptResources] : [],
			styleHashes: manifest.csp?.styleHashes ? [...manifest.csp.styleHashes] : [],
			styleResources: manifest.csp?.styleResources ? [...manifest.csp.styleResources] : [],
			directives: manifest.csp?.directives ? [...manifest.csp.directives] : [],
			isStrictDynamic: manifest.csp?.isStrictDynamic ?? false,
			internalFetchHeaders: manifest.internalFetchHeaders,
		};
		this.result = result;
		return result;
	}
	/**
	 * Creates the Astro global object for a component render.
	 */
	createAstro(result, props, slotValues, apiContext) {
		let astroPagePartial;
		if (this.isRewriting) {
			this.#astroPagePartial = this.createAstroPagePartial(result, apiContext);
		}
		this.#astroPagePartial ??= this.createAstroPagePartial(result, apiContext);
		astroPagePartial = this.#astroPagePartial;
		const astroComponentPartial = { props, self: null };
		const Astro = Object.assign(Object.create(astroPagePartial), astroComponentPartial);
		let _slots;
		Object.defineProperty(Astro, 'slots', {
			get: () => {
				if (!_slots) {
					_slots = new Slots(result, slotValues, this.pipeline.logger);
				}
				return _slots;
			},
		});
		return Astro;
	}
	/**
	 * Creates the Astro page-level partial (prototype for Astro global).
	 */
	createAstroPagePartial(result, apiContext) {
		const state = this;
		const { cookies, locals, params, pipeline, url } = this;
		const { response } = result;
		const redirect = (path, status = 302) => {
			if (state.request[responseSentSymbol]) {
				throw new AstroError({
					...AstroErrorData.ResponseSentError,
				});
			}
			return new Response(null, { status, headers: { Location: path } });
		};
		const rewrite = async (reroutePayload) => {
			return await state.rewrite(reroutePayload);
		};
		const callAction = createCallAction(apiContext);
		const partial = {
			generator: ASTRO_GENERATOR,
			routePattern: this.routeData.route,
			isPrerendered: this.routeData.prerender,
			cookies,
			get clientAddress() {
				return state.getClientAddress();
			},
			get currentLocale() {
				return state.computeCurrentLocale();
			},
			params,
			get preferredLocale() {
				return state.computePreferredLocale();
			},
			get preferredLocaleList() {
				return state.computePreferredLocaleList();
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
				return getOriginPathname(state.request);
			},
			get csp() {
				return state.getCsp();
			},
			get logger() {
				return {
					info(msg) {
						pipeline.logger.info(null, msg);
					},
					warn(msg) {
						pipeline.logger.warn(null, msg);
					},
					error(msg) {
						pipeline.logger.error(null, msg);
					},
				};
			},
		};
		this.defineProviderGetters(partial);
		return partial;
	}
	getClientAddress() {
		const { pipeline, clientAddress } = this;
		const routeData = this.routeData;
		if (routeData.prerender) {
			throw new AstroError({
				...AstroErrorData.PrerenderClientAddressNotAvailable,
				message: AstroErrorData.PrerenderClientAddressNotAvailable.message(routeData.component),
			});
		}
		if (clientAddress) {
			return clientAddress;
		}
		if (pipeline.adapterName) {
			throw new AstroError({
				...AstroErrorData.ClientAddressNotAvailable,
				message: AstroErrorData.ClientAddressNotAvailable.message(pipeline.adapterName),
			});
		}
		throw new AstroError(AstroErrorData.StaticClientAddressNotAvailable);
	}
	getCookies() {
		return this.cookies;
	}
	getCsp() {
		const state = this;
		const { pipeline } = this;
		if (!pipeline.manifest.csp) {
			if (pipeline.runtimeMode === 'production') {
				pipeline.logger.warn(
					'csp',
					`context.csp was used when rendering the route ${colors.green(state.routeData.route)}, but CSP was not configured. For more information, see https://docs.astro.build/en/reference/configuration-reference/#securitycsp`,
				);
			}
			return void 0;
		}
		return {
			insertDirective(payload) {
				if (state?.result?.directives) {
					state.result.directives = pushDirective(state.result.directives, payload);
				} else {
					state?.result?.directives.push(payload);
				}
			},
			insertScriptResource(resource) {
				state.result?.scriptResources.push(resource);
			},
			insertStyleResource(resource) {
				state.result?.styleResources.push(resource);
			},
			insertStyleHash(hash) {
				state.result?.styleHashes.push(hash);
			},
			insertScriptHash(hash) {
				state.result?.scriptHashes.push(hash);
			},
		};
	}
	computeCurrentLocale() {
		const {
			url,
			pipeline: { i18n },
			routeData,
		} = this;
		if (!i18n || !routeData) return;
		const { defaultLocale, locales, strategy } = i18n;
		const fallbackTo =
			strategy === 'pathname-prefix-other-locales' || strategy === 'domains-prefix-other-locales'
				? defaultLocale
				: void 0;
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
				computedLocale = computeCurrentLocaleUtil(referer, locales, defaultLocale);
			}
		} else {
			let pathname = routeData.pathname;
			if (url && !routeData.pattern.test(url.pathname)) {
				for (const fallbackRoute of routeData.fallbackRoutes) {
					if (fallbackRoute.pattern.test(url.pathname)) {
						pathname = fallbackRoute.pathname;
						break;
					}
				}
			}
			pathname =
				pathname && !isRoute404or500(routeData) ? pathname : (url.pathname ?? this.pathname);
			computedLocale = computeCurrentLocaleUtil(pathname, locales, defaultLocale);
			if (routeData.params.length > 0) {
				const localeFromParams = computeCurrentLocaleFromParams(this.params, locales);
				if (localeFromParams) {
					computedLocale = localeFromParams;
				}
			}
		}
		this.#currentLocale = computedLocale ?? fallbackTo;
		return this.#currentLocale;
	}
	computePreferredLocale() {
		const {
			pipeline: { i18n },
			request,
		} = this;
		if (!i18n) return;
		return (this.#preferredLocale ??= computePreferredLocaleUtil(request, i18n.locales));
	}
	computePreferredLocaleList() {
		const {
			pipeline: { i18n },
			request,
		} = this;
		if (!i18n) return;
		return (this.#preferredLocaleList ??= computePreferredLocaleListUtil(request, i18n.locales));
	}
	/**
	 * Lazily loads the route's component module. Returns the cached
	 * instance if already loaded. The promise is cached so concurrent
	 * callers share the same load.
	 */
	async loadComponentInstance() {
		if (this.componentInstance) return this.componentInstance;
		if (this.#componentInstancePromise) return this.#componentInstancePromise;
		this.#componentInstancePromise = this.pipeline
			.getComponentByRoute(this.routeData)
			.then((mod) => {
				this.componentInstance = mod;
				return mod;
			});
		return this.#componentInstancePromise;
	}
	/**
	 * Registers a context provider under the given key. Handlers call
	 * this to contribute values to the request context (e.g. sessions).
	 * The `create` factory is called lazily on the first `resolve(key)`.
	 */
	provide(key, provider) {
		(this.#providers ??= /* @__PURE__ */ new Map()).set(key, provider);
	}
	/**
	 * Lazily resolves a provider registered under `key`. Calls
	 * `provider.create()` on first access and caches the result.
	 * Returns `undefined` if no provider was registered for the key.
	 */
	resolve(key) {
		if (this.#providersResolvedValues?.has(key)) {
			return this.#providersResolvedValues.get(key);
		}
		const provider = this.#providers?.get(key);
		if (!provider) return void 0;
		const value = provider.create();
		(this.#providersResolvedValues ??= /* @__PURE__ */ new Map()).set(key, value);
		return value;
	}
	/**
	 * Runs all registered `finalize` callbacks. Should be called after
	 * the response is produced, typically in a `finally` block.
	 *
	 * Returns synchronously (no promise allocation) when nothing needs
	 * finalizing — important for the hot path where sessions are not used.
	 */
	finalizeAll() {
		if (!this.#providersResolvedValues || this.#providersResolvedValues.size === 0) return;
		let chain;
		for (const [key, provider] of this.#providers) {
			if (provider.finalize && this.#providersResolvedValues.has(key)) {
				const result = provider.finalize(this.#providersResolvedValues.get(key));
				if (result) {
					chain = chain ? chain.then(() => result) : result;
				}
			}
		}
		return chain;
	}
	/**
	 * Adds lazy getters to `target` for each registered provider key.
	 * Used by context creation (APIContext, Astro global) so that
	 * provider values like `session` and `cache` appear as properties
	 * without hard-coding the keys.
	 */
	defineProviderGetters(target) {
		if (!this.#providers) return;
		const state = this;
		for (const key of this.#providers.keys()) {
			Object.defineProperty(target, key, {
				get: () => state.resolve(key),
				enumerable: true,
				configurable: true,
			});
		}
	}
	/**
	 * Resolves the route to use for this request and stores it on
	 * `this.routeData`. If the adapter (or the dev server) provided a
	 * `routeData` via render options it's already set and this is a
	 * no-op. Otherwise we use the app's synchronous route matcher and
	 * fall back to a `404.astro` route so middleware can still run.
	 *
	 * Called eagerly from the constructor so individual handlers
	 * (actions, pages, middleware, etc.) always see a resolved route
	 * without the caller needing an extra setup step.
	 *
	 * Once routeData is known, finalizes `this.pathname`: in dev, if the
	 * matched route has no `.html` extension, strip `.html` / `/index.html`
	 * suffixes so the rendering pipeline sees the canonical pathname.
	 */
	/**
	 * Strip `.html` / `/index.html` suffixes from the pathname so the
	 * rendering pipeline sees the canonical route path. Skipped when the
	 * matched route itself has an `.html` extension in its definition.
	 */
	#stripHtmlExtension() {
		if (this.routeData && !routeHasHtmlExtension(this.routeData)) {
			this.pathname = this.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
		}
	}
	#resolveRouteData() {
		const pipeline = this.pipeline;
		if (this.routeData) {
			this.#stripHtmlExtension();
			return;
		}
		const matched = pipeline.matchRoute(this.pathname);
		if (matched && matched.prerender && pipeline.manifest.serverLike) {
			this.routeData = void 0;
		} else {
			this.routeData = matched;
		}
		pipeline.logger.debug('router', 'Astro matched the following route for ' + this.request.url);
		pipeline.logger.debug('router', 'RouteData:\n' + this.routeData);
		if (!this.routeData) {
			this.routeData = pipeline.manifestData.routes.find(
				(route) => route.component === '404.astro' || route.component === DEFAULT_404_COMPONENT,
			);
		}
		if (!this.routeData) {
			pipeline.logger.debug('router', "Astro hasn't found routes that match " + this.request.url);
			pipeline.logger.debug('router', "Here's the available routes:\n", pipeline.manifestData);
			return;
		}
		this.#stripHtmlExtension();
	}
	/**
	 * Strips the pipeline's base from the request URL, prepends a forward
	 * slash, and decodes the pathname. Falls back to the raw (not decoded)
	 * pathname if `decodeURI` throws.
	 *
	 * Mirrors `BaseApp.removeBase`, including the
	 * `collapseDuplicateLeadingSlashes` fix that prevents middleware
	 * authorization bypass when the URL starts with `//`.
	 */
	#computePathname(url) {
		let pathname = collapseDuplicateLeadingSlashes(url.pathname);
		const base = this.pipeline.manifest.base;
		if (pathname.startsWith(base)) {
			const baseWithoutTrailingSlash = removeTrailingForwardSlash(base);
			pathname = pathname.slice(baseWithoutTrailingSlash.length + 1);
		}
		pathname = prependForwardSlash(pathname);
		try {
			return decodeURI(pathname);
		} catch (e) {
			this.pipeline.logger.error(null, e.toString());
			return pathname;
		}
	}
	/**
	 * Returns the resolved `props` for this render, computing them lazily
	 * from the route + component module on first access. If the
	 * `initialProps` already carries user-supplied props (e.g. the
	 * container API) those are used verbatim.
	 */
	async getProps() {
		if (this.props !== null) return this.props;
		if (Object.keys(this.initialProps).length > 0) {
			this.props = this.initialProps;
			return this.props;
		}
		const pipeline = this.pipeline;
		const mod = await this.loadComponentInstance();
		this.props = await getProps({
			mod,
			routeData: this.routeData,
			routeCache: pipeline.routeCache,
			pathname: this.pathname,
			logger: pipeline.logger,
			serverLike: pipeline.manifest.serverLike,
			base: pipeline.manifest.base,
			trailingSlash: pipeline.manifest.trailingSlash,
		});
		return this.props;
	}
	/**
	 * Returns the `ActionAPIContext` for this render, creating it lazily.
	 * Used by middleware, actions, and page dispatch.
	 */
	getActionAPIContext() {
		if (this.actionApiContext !== null) return this.actionApiContext;
		const state = this;
		const ctx = {
			get cookies() {
				return state.cookies;
			},
			routePattern: this.routeData.route,
			isPrerendered: this.routeData.prerender,
			get clientAddress() {
				return state.getClientAddress();
			},
			get currentLocale() {
				return state.computeCurrentLocale();
			},
			generator: ASTRO_GENERATOR,
			get locals() {
				return state.locals;
			},
			set locals(_) {
				throw new AstroError(AstroErrorData.LocalsReassigned);
			},
			// SAFETY: getActionAPIContext is only called after route resolution,
			// so routeData is always set and the params getter always returns a value.
			params: this.params,
			get preferredLocale() {
				return state.computePreferredLocale();
			},
			get preferredLocaleList() {
				return state.computePreferredLocaleList();
			},
			request: this.request,
			site: this.pipeline.site,
			url: this.url,
			get originPathname() {
				return getOriginPathname(state.request);
			},
			get csp() {
				return state.getCsp();
			},
			get logger() {
				if (!state.pipeline.manifest.experimentalLogger) {
					state.pipeline.logger.warn(
						null,
						'The Astro.logger is available only when experimental.logger is defined.',
					);
					return void 0;
				}
				return {
					info(msg) {
						state.pipeline.logger.info(null, msg);
					},
					warn(msg) {
						state.pipeline.logger.warn(null, msg);
					},
					error(msg) {
						state.pipeline.logger.error(null, msg);
					},
				};
			},
		};
		this.defineProviderGetters(ctx);
		this.actionApiContext = ctx;
		return this.actionApiContext;
	}
	/**
	 * Returns the `APIContext` for this render, creating it lazily from
	 * the memoized props + action context.
	 *
	 * Callers must ensure `getProps()` has resolved at least once before
	 * calling this.
	 */
	getAPIContext() {
		if (this.apiContext !== null) return this.apiContext;
		const actionApiContext = this.getActionAPIContext();
		const state = this;
		const redirect = (path, status = 302) =>
			new Response(null, { status, headers: { Location: path } });
		const rewrite = async (reroutePayload) => {
			return await state.rewrite(reroutePayload);
		};
		Reflect.set(actionApiContext, pipelineSymbol, this.pipeline);
		actionApiContext[fetchStateSymbol] = this;
		this.apiContext = Object.assign(actionApiContext, {
			props: this.props,
			redirect,
			rewrite,
			getActionResult: createGetActionResult(actionApiContext.locals),
			callAction: createCallAction(actionApiContext),
		});
		return this.apiContext;
	}
	/**
	 * Invalidates the cached `APIContext` so the next `getAPIContext()`
	 * call re-derives it from the (possibly mutated) state. Used
	 * after an in-flight rewrite swaps the route / request / params.
	 */
	invalidateContexts() {
		this.props = null;
		this.actionApiContext = null;
		this.apiContext = null;
	}
}
export { FetchState, getFetchStateFromAPIContext };
