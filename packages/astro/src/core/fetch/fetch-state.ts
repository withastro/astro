import colors from 'piccolore';
import {
	collapseDuplicateLeadingSlashes,
	prependForwardSlash,
	removeTrailingForwardSlash,
} from '@astrojs/internal-helpers/path';
import { deserializeActionResult } from '../../actions/runtime/client.js';
import { createCallAction, createGetActionResult, hasActionPayload } from '../../actions/utils.js';
import type { ActionAPIContext } from '../../actions/runtime/types.js';
import type { ComponentInstance } from '../../types/astro.js';
import type { Params, Props, RewritePayload } from '../../types/public/common.js';
import type { APIContext, AstroGlobal } from '../../types/public/context.js';
import type { RouteData, SSRResult } from '../../types/public/internal.js';
import { AstroCookies } from '../cookies/index.js';
import { type Pipeline, Slots } from '../render/index.js';
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
import type { ResolvedRenderOptions } from '../app/base.js';
import { getRenderOptions } from '../app/render-options.js';

/**
 * Describes a lazily-created value that handlers can contribute to the
 * request context. `create` is called at most once (on first `resolve`);
 * `finalize` runs during `finalizeAll` to clean up / persist.
 */
export interface ContextProvider<T> {
	/** Factory called lazily on the first `resolve(key)`. */
	create: () => T;
	/** Optional cleanup / persist callback. Receives the created value. */
	finalize?: (value: T) => Promise<void> | void;
}

/**
 * The public contract of {@link FetchState} exposed to user-land code
 * (custom fetch handlers, Hono middleware, etc.).
 *
 * Only the members listed here are part of the stable public API.
 * Everything else on the concrete `FetchState` class is internal and
 * may change without notice.
 *
 * If you add a new member to `FetchState` that should be user-visible,
 * add it here first — the `implements` clause on the class ensures a
 * compile-time error if the class falls out of sync.
 */
export interface AstroFetchState {
	/** The incoming request. */
	readonly request: Request;
	/** Normalized URL derived from the request. */
	readonly url: URL;
	/** Base-stripped, decoded pathname of the request. */
	readonly pathname: string;
	/** The matched route for this request, if any. */
	readonly routeData: RouteData | undefined;
	/** Cookies for this request. */
	readonly cookies: AstroCookies;
	/** Request-scoped locals object, shared with user middleware. */
	readonly locals: App.Locals;
	/** Route params derived from routeData + pathname. */
	readonly params: Params | undefined;
	/** Default HTTP status for the rendered response. */
	status: number;

	/**
	 * Triggers a rewrite to a different route.
	 *
	 * [Astro reference](https://docs.astro.build/en/guides/routing/#rewrites)
	 */
	rewrite(payload: RewritePayload): Promise<Response>;

	/**
	 * Registers a context provider under the given key. The `create`
	 * factory is called lazily on the first `resolve(key)`.
	 */
	provide<T>(key: string, provider: ContextProvider<T>): void;

	/**
	 * Lazily resolves a provider registered under `key`. Returns
	 * `undefined` if no provider was registered for the key.
	 */
	resolve<T>(key: string): T | undefined;

	/**
	 * Runs all registered provider `finalize` callbacks. Call this after
	 * the response is produced, typically in a `finally` block.
	 */
	finalizeAll(): Promise<void> | void;
}

/**
 * Retrieves the `FetchState` stashed on an `APIContext` by
 * `FetchState.getAPIContext()`. Throws if not found — this indicates
 * the context was not created through Astro's request pipeline.
 */
export function getFetchStateFromAPIContext(context: APIContext): FetchState {
	const state = (context as any)[fetchStateSymbol] as FetchState | undefined;
	if (!state) {
		throw new Error(
			"FetchState not found on APIContext. This is an internal error — the context was not created through Astro's request pipeline.",
		);
	}
	return state;
}

/**
 * Holds per-request state as it flows through the handler pipeline.
 *
 * **This class is user-facing** via `astro/fetch` and `astro/hono`.
 * The {@link AstroFetchState} interface defines the stable public
 * surface. Members not on that interface are internal and
 * may change without notice.
 *
 * Performance note: fields on this class are plain properties — ES
 * private fields (`#foo`) have a non-zero per-access cost in V8
 * which is measurable on the hot render path, so `#` is used only
 * for rarely-accessed memoized caches and Maps.
 */
export class FetchState implements AstroFetchState {
	pipeline: Pipeline;
	/**
	 * The request to render. Mutated during rewrites so subsequent renders
	 * see the rewritten URL.
	 */
	request: Request;
	routeData: RouteData | undefined;
	/**
	 * The pathname to use for routing and rendering. Starts out as the raw,
	 * base-stripped, decoded pathname from the request. May be further
	 * normalized by `AstroHandler` after routeData is known (in dev, when
	 * the matched route has no `.html` extension, `.html` / `/index.html`
	 * suffixes are stripped).
	 */
	pathname: string;
	/** Resolved render options (addCookieHeader, clientAddress, locals, etc.). */
	readonly renderOptions: ResolvedRenderOptions;
	/** When the request started, used to log duration. */
	readonly timeStart: number;

	/**
	 * The route's loaded component module. Set before middleware runs; may
	 * be swapped during in-flight rewrites from inside the middleware chain.
	 */
	componentInstance: ComponentInstance | undefined;
	/**
	 * Slot overrides supplied by the container API. `undefined` for HTTP
	 * requests — `PagesHandler` coalesces to `{}` on read so we don't
	 * allocate an empty object per request.
	 */
	slots: Record<string, any> | undefined;
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
	cookies: AstroCookies;
	/** Route params derived from routeData + pathname. Computed lazily. */
	#params: Params | undefined;
	get params(): Params | undefined {
		if (!this.#params && this.routeData) {
			this.#params = getParams(this.routeData, this.pathname);
		}
		return this.#params;
	}
	set params(value: Params | undefined) {
		this.#params = value;
	}
	/** Normalized URL for this request. */
	url: URL;
	/** Client address for this request. */
	clientAddress: string | undefined;
	/** Whether this is a partial render (container API). */
	partial: boolean | undefined;
	/** Whether to inject CSP meta tags. */
	shouldInjectCspMetaTags: boolean | undefined;
	/** Request-scoped locals object, shared with user middleware. */
	locals: App.Locals = {} as App.Locals;

	/**
	 * Memoized `props` (see `getProps`). `null` means "not yet computed"
	 * — using `null` (rather than `undefined`) keeps the hidden class
	 * stable and distinct from a valid-but-empty result.
	 */
	props: APIContext['props'] | null = null;
	/** Memoized `ActionAPIContext` (see `getActionAPIContext`). */
	actionApiContext: ActionAPIContext | null = null;
	/** Memoized `APIContext` (see `getAPIContext`). */
	apiContext: APIContext | null = null;

	/** Registered context providers keyed by name. Lazy-initialized on first provide(). */
	#providers: Map<string, ContextProvider<unknown>> | undefined;
	/** Cached values from resolved providers. Lazy-initialized on first resolve(). */
	#providersResolvedValues: Map<string, unknown> | undefined;
	/** Cached promise for lazy component instance loading. */
	#componentInstancePromise: Promise<ComponentInstance> | undefined;
	/** SSR result for the current page render. */
	result: SSRResult | undefined;
	/** Initial props (from container/error handler). */
	initialProps: Props = {};
	/** Rewrites handler instance. Lazy-initialized on first rewrite(). */
	#rewrites: Rewrites | undefined;
	/** Memoized Astro page partial. */
	#astroPagePartial?: Omit<AstroGlobal, 'props' | 'self' | 'slots'>;
	/** Memoized current locale. */
	#currentLocale: APIContext['currentLocale'];
	/** Memoized preferred locale. */
	#preferredLocale: APIContext['preferredLocale'];
	/** Memoized preferred locale list. */
	#preferredLocaleList: APIContext['preferredLocaleList'];

	constructor(pipeline: Pipeline, request: Request, options?: ResolvedRenderOptions) {
		this.pipeline = pipeline;
		this.request = request;
		// Accept options directly (fast path from BaseApp.render) or fall
		// back to reading them from the request symbol (user fetch handlers).
		options ??= getRenderOptions(request);
		this.routeData = options?.routeData;
		this.renderOptions = options ?? {
			addCookieHeader: false,
			clientAddress: undefined,
			locals: undefined,
			prerenderedErrorPageFetch: fetch,
			routeData: undefined,
			waitUntil: undefined,
		};

		this.componentInstance = undefined;
		this.slots = undefined;
		// Parse the URL once and derive both pathname and url from it.
		const url = new URL(request.url);
		this.pathname = this.#computePathname(url);
		this.timeStart = performance.now();
		this.clientAddress = options?.clientAddress;
		this.locals = (options?.locals ?? {}) as App.Locals;
		this.url = normalizeUrl(url);
		this.cookies = new AstroCookies(request);

		// Set origin pathname for rewrite tracking.
		if (!Reflect.get(request, originPathnameSymbol)) {
			setOriginPathname(
				request,
				this.pathname,
				pipeline.manifest.trailingSlash,
				pipeline.manifest.buildFormat,
			);
		}

		// Eagerly resolve the route when it wasn't provided via render
		// options. In dev the route is always passed through render options
		// (handleRequest calls devMatch before render). In production
		// app.match() is synchronous.
		this.#resolveRouteData();
	}

	/**
	 * Triggers a rewrite. Delegates to the Rewrites handler.
	 */
	rewrite(payload: RewritePayload): Promise<Response> {
		return (this.#rewrites ??= new Rewrites()).execute(this, payload);
	}

	/**
	 * Creates the SSR result for the current page render.
	 */
	async createResult(mod: ComponentInstance, ctx: ActionAPIContext): Promise<SSRResult> {
		const pipeline = this.pipeline;
		const { clientDirectives, inlinedScripts, compressHTML, manifest, renderers, resolve } =
			pipeline;
		const routeData = this.routeData!;
		const { links, scripts, styles } = await pipeline.headElements(routeData);

		const extraStyleHashes: string[] = [];
		const extraScriptHashes: string[] = [];
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
			: undefined;
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
		} satisfies AstroGlobal['response'];

		const state = this;
		const result: SSRResult = {
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
			params: this.params!,
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
				return serverIslands.serverIslandNameMap ?? new Map();
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
	createAstro(
		result: SSRResult,
		props: Record<string, any>,
		slotValues: Record<string, any> | null,
		apiContext: ActionAPIContext,
	): AstroGlobal {
		// The page partial (prototype for the Astro global) is cached for the
		// lifetime of the request since it only depends on route-level state
		// (cookies, locals, params, etc.). On the first call it's created and
		// cached; subsequent components reuse it. During a rewrite the route
		// changes, so we must recreate it to pick up the new state.
		let astroPagePartial;
		if (this.isRewriting) {
			this.#astroPagePartial = this.createAstroPagePartial(result, apiContext);
		}
		this.#astroPagePartial ??= this.createAstroPagePartial(result, apiContext);
		astroPagePartial = this.#astroPagePartial;
		const astroComponentPartial = { props, self: null };
		const Astro: Omit<AstroGlobal, 'self' | 'slots'> = Object.assign(
			Object.create(astroPagePartial),
			astroComponentPartial,
		);

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

	/**
	 * Creates the Astro page-level partial (prototype for Astro global).
	 */
	createAstroPagePartial(
		result: SSRResult,
		apiContext: ActionAPIContext,
	): Omit<AstroGlobal, 'props' | 'self' | 'slots'> {
		const state = this;
		const { cookies, locals, params, pipeline, url } = this;
		const { response } = result;
		const redirect = (path: string, status = 302) => {
			if ((state.request as any)[responseSentSymbol]) {
				throw new AstroError({
					...AstroErrorData.ResponseSentError,
				});
			}
			return new Response(null, { status, headers: { Location: path } });
		};

		const rewrite = async (reroutePayload: RewritePayload) => {
			return await state.rewrite(reroutePayload);
		};

		const callAction = createCallAction(apiContext);

		const partial: Record<string, any> = {
			generator: ASTRO_GENERATOR,
			routePattern: this.routeData!.route,
			isPrerendered: this.routeData!.prerender,
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
			get logger(): APIContext['logger'] {
				return {
					info(msg: string) {
						pipeline.logger.info(null, msg);
					},
					warn(msg: string) {
						pipeline.logger.warn(null, msg);
					},
					error(msg: string) {
						pipeline.logger.error(null, msg);
					},
				};
			},
		};

		this.defineProviderGetters(partial);

		return partial as Omit<AstroGlobal, 'props' | 'self' | 'slots'>;
	}

	getClientAddress(): string {
		const { pipeline, clientAddress } = this;
		const routeData = this.routeData!;

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

	getCookies(): AstroCookies {
		return this.cookies;
	}

	getCsp(): APIContext['csp'] {
		const state = this;
		const { pipeline } = this;
		if (!pipeline.manifest.csp) {
			if (pipeline.runtimeMode === 'production') {
				pipeline.logger.warn(
					'csp',
					`context.csp was used when rendering the route ${colors.green(state.routeData!.route)}, but CSP was not configured. For more information, see https://docs.astro.build/en/reference/configuration-reference/#securitycsp`,
				);
			}
			return undefined;
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
			// routeData.params is the route's parameter *names* (e.g. ['lang']);
			// this.params is the resolved *values* for this request (e.g. { lang: 'en' }).
			// If the route has parameters, the locale may be embedded in them.
			if (routeData.params.length > 0) {
				// SAFETY: routeData is set (guarded above), so the params getter resolves.
				const localeFromParams = computeCurrentLocaleFromParams(this.params!, locales);
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
	async loadComponentInstance(): Promise<ComponentInstance> {
		if (this.componentInstance) return this.componentInstance;
		if (this.#componentInstancePromise) return this.#componentInstancePromise;

		this.#componentInstancePromise = this.pipeline
			.getComponentByRoute(this.routeData!)
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
	provide<T>(key: string, provider: ContextProvider<T>): void {
		(this.#providers ??= new Map()).set(key, provider as ContextProvider<unknown>);
	}

	/**
	 * Lazily resolves a provider registered under `key`. Calls
	 * `provider.create()` on first access and caches the result.
	 * Returns `undefined` if no provider was registered for the key.
	 */
	resolve<T>(key: string): T | undefined {
		if (this.#providersResolvedValues?.has(key)) {
			return this.#providersResolvedValues.get(key) as T;
		}
		const provider = this.#providers?.get(key);
		if (!provider) return undefined;
		const value = provider.create();
		(this.#providersResolvedValues ??= new Map()).set(key, value);
		return value as T;
	}

	/**
	 * Runs all registered `finalize` callbacks. Should be called after
	 * the response is produced, typically in a `finally` block.
	 *
	 * Returns synchronously (no promise allocation) when nothing needs
	 * finalizing — important for the hot path where sessions are not used.
	 */
	finalizeAll(): Promise<void> | void {
		// Fast path: nothing to finalize.
		if (!this.#providersResolvedValues || this.#providersResolvedValues.size === 0) return;

		let chain: Promise<void> | undefined;
		for (const [key, provider] of this.#providers!) {
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
	defineProviderGetters(target: Record<string, any>): void {
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
	#stripHtmlExtension(): void {
		if (this.routeData && !routeHasHtmlExtension(this.routeData)) {
			this.pathname = this.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
		}
	}

	#resolveRouteData(): void {
		const pipeline = this.pipeline;

		// Fast path: routeData was provided via render options (build, dev
		// with adapter).
		if (this.routeData) {
			this.#stripHtmlExtension();
			return;
		}

		// this.pathname is already decoded by #computePathname, so no
		// additional decodeURI here — that would double-decode and allow
		// double-encoded paths like /%2561dmin to bypass route checks.
		const matched = pipeline.matchRoute(this.pathname);
		// In production SSR, prerendered routes are served as static files
		// by the hosting layer and should not be rendered by the app.
		if (matched && matched.prerender && pipeline.manifest.serverLike) {
			this.routeData = undefined;
		} else {
			this.routeData = matched;
		}
		pipeline.logger.debug('router', 'Astro matched the following route for ' + this.request.url);
		pipeline.logger.debug('router', 'RouteData:\n' + this.routeData);

		// Fall back to a 404 route so middleware can still run.
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
	#computePathname(url: URL): string {
		let pathname = collapseDuplicateLeadingSlashes(url.pathname);
		const base = this.pipeline.manifest.base;
		if (pathname.startsWith(base)) {
			const baseWithoutTrailingSlash = removeTrailingForwardSlash(base);
			pathname = pathname.slice(baseWithoutTrailingSlash.length + 1);
		}
		pathname = prependForwardSlash(pathname);
		try {
			return decodeURI(pathname);
		} catch (e: any) {
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
	async getProps(): Promise<APIContext['props']> {
		if (this.props !== null) return this.props;
		if (Object.keys(this.initialProps).length > 0) {
			this.props = this.initialProps;
			return this.props;
		}
		const pipeline = this.pipeline;
		const mod = await this.loadComponentInstance();
		this.props = await getProps({
			mod,
			routeData: this.routeData!,
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
	getActionAPIContext(): ActionAPIContext {
		if (this.actionApiContext !== null) return this.actionApiContext;

		const state = this;

		const ctx = {
			get cookies() {
				return state.cookies;
			},
			routePattern: this.routeData!.route,
			isPrerendered: this.routeData!.prerender,
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
			params: this.params!,
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
			get logger(): APIContext['logger'] {
				if (!state.pipeline.manifest.experimentalLogger) {
					state.pipeline.logger.warn(
						null,
						'The Astro.logger is available only when experimental.logger is defined.',
					);
					return undefined;
				}
				return {
					info(msg: string) {
						state.pipeline.logger.info(null, msg);
					},
					warn(msg: string) {
						state.pipeline.logger.warn(null, msg);
					},
					error(msg: string) {
						state.pipeline.logger.error(null, msg);
					},
				};
			},
		};

		// Dynamically add lazy getters for each registered provider.
		// This is how ctx.session, ctx.cache, etc. are populated without
		// FetchState hard-coding the provider keys.
		this.defineProviderGetters(ctx);

		this.actionApiContext = ctx as ActionAPIContext;
		return this.actionApiContext;
	}

	/**
	 * Returns the `APIContext` for this render, creating it lazily from
	 * the memoized props + action context.
	 *
	 * Callers must ensure `getProps()` has resolved at least once before
	 * calling this.
	 */
	getAPIContext(): APIContext {
		if (this.apiContext !== null) return this.apiContext;

		const actionApiContext = this.getActionAPIContext();
		const state = this;

		const redirect = (path: string, status = 302) =>
			new Response(null, { status, headers: { Location: path } });

		const rewrite = async (reroutePayload: RewritePayload) => {
			return await state.rewrite(reroutePayload);
		};

		Reflect.set(actionApiContext, pipelineSymbol, this.pipeline);
		(actionApiContext as any)[fetchStateSymbol] = this;

		this.apiContext = Object.assign(actionApiContext, {
			props: this.props!,
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
	invalidateContexts(): void {
		this.props = null;
		this.actionApiContext = null;
		this.apiContext = null;
	}
}
