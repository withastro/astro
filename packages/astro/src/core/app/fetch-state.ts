import {
	collapseDuplicateLeadingSlashes,
	prependForwardSlash,
	removeTrailingForwardSlash,
} from '@astrojs/internal-helpers/path';
import { createCallAction, createGetActionResult } from '../../actions/utils.js';
import type { ActionAPIContext } from '../../actions/runtime/types.js';
import type { ComponentInstance } from '../../types/astro.js';
import type { RewritePayload } from '../../types/public/common.js';
import type { APIContext } from '../../types/public/context.js';
import type { RouteData } from '../../types/public/internal.js';
import type { BaseApp } from './base.js';
import type { Pipeline } from '../base-pipeline.js';
import { ASTRO_GENERATOR, DEFAULT_404_COMPONENT, appSymbol, fetchStateSymbol, pipelineSymbol } from '../constants.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { RenderContext } from '../render-context.js';
import { getProps } from '../render/index.js';
import { getOriginPathname } from '../routing/rewrite.js';
import { routeHasHtmlExtension } from '../routing/helpers.js';
import type { ResolvedRenderOptions } from './base.js';
import { getRenderOptions } from './render-options.js';

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
 * Holds per-request state as it flows through the handler pipeline.
 *
 * `FetchState` centralizes things that used to be ad-hoc locals in
 * `AstroHandler.handle()`: the matched route, the resolved pathname, the
 * resolved render options, the active `RenderContext`, the component
 * module, and the lazily-built `APIContext` / `ActionAPIContext`.
 *
 * Handler steps populate and read `FetchState` as the request progresses.
 * `AstroHandler` resolves `routeData` and creates the `RenderContext`;
 * `AstroMiddleware` reads the cached contexts via `getAPIContext()` /
 * `getActionAPIContext()`.
 *
 * A `FetchState` can be mutated mid-request (for rewrites) and re-run
 * through `AstroHandler.render(state)` to produce a new response without
 * losing cross-route state like `locals`, `addCookieHeader`, etc.
 *
 * Internal note: fields on this class are plain public properties —
 * this class is entirely internal, and private fields (`#foo`) have a
 * non-zero per-access cost in V8 which is measurable on the hot render
 * path.
 */
export class FetchState {
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
	 * The active `RenderContext`. Assigned by `AstroHandler.render`
	 * (and error handlers / container) before middleware runs.
	 */
	renderContext: RenderContext | undefined;
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
	 * before `getRenderContext()` runs (e.g. `AstroHandler` sets this from
	 * `BaseApp.getDefaultStatusCode`; error handlers set `404` / `500`).
	 */
	status = 200;

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

	/** Registered context providers keyed by name. */
	#providers = new Map<string, ContextProvider<unknown>>();
	/** Cached values from resolved providers. */
	#resolved = new Map<string, unknown>();
	/** Cached promise for lazy render context creation. */
	#renderContextPromise: Promise<RenderContext> | undefined;

	constructor(pipeline: Pipeline, request: Request) {
		this.pipeline = pipeline;
		this.request = request;
		const options = getRenderOptions(request);
		this.routeData = options?.routeData;
		this.renderOptions = {
			addCookieHeader: options?.addCookieHeader ?? false,
			clientAddress: options?.clientAddress,
			locals: options?.locals,
			prerenderedErrorPageFetch: options?.prerenderedErrorPageFetch ?? fetch,
			routeData: options?.routeData,
		};
		this.renderContext = undefined;
		this.componentInstance = undefined;
		this.slots = undefined;
		this.pathname = this.#computePathname();
		this.timeStart = performance.now();
	}

	/**
	 * Whether user middleware should be skipped for this request.
	 * Delegates to `renderContext.skipMiddleware`; returns `false` if
	 * no render context has been set yet.
	 */
	get skipMiddleware(): boolean {
		return this.renderContext?.skipMiddleware ?? false;
	}

	/**
	 * Ensures the `RenderContext` exists, creating it lazily if needed.
	 * Also loads the route's component module and registers providers
	 * (session, cache). Returns the render context.
	 *
	 * When `AstroHandler.render` sets `renderContext` explicitly before
	 * this is called, the existing context is returned as-is.
	 */
	async ensureRenderContext(): Promise<RenderContext> {
		if (this.renderContext) return this.renderContext;
		if (this.#renderContextPromise) return this.#renderContextPromise;

		this.#renderContextPromise = this.#createRenderContext();
		return this.#renderContextPromise;
	}

	async #createRenderContext(): Promise<RenderContext> {
		const app = this.app;
		const routeData = this.routeData!;
		const { clientAddress, locals } = this.renderOptions;

		// Load the route module if not already set
		if (!this.componentInstance) {
			this.componentInstance = await app.pipeline.getComponentByRoute(routeData);
		}

		const renderContext = await RenderContext.create({
			pipeline: app.pipeline,
			locals,
			pathname: this.pathname,
			request: this.request,
			routeData,
			status: this.status,
			clientAddress,
		});

		this.renderContext = renderContext;
		renderContext.fetchState = this;

		return renderContext;
	}

	/**
	 * Registers a context provider under the given key. Handlers call
	 * this to contribute values to the request context (e.g. sessions).
	 * The `create` factory is called lazily on the first `resolve(key)`.
	 */
	provide<T>(key: string, provider: ContextProvider<T>): void {
		this.#providers.set(key, provider as ContextProvider<unknown>);
	}

	/**
	 * Lazily resolves a provider registered under `key`. Calls
	 * `provider.create()` on first access and caches the result.
	 * Returns `undefined` if no provider was registered for the key.
	 */
	resolve<T>(key: string): T | undefined {
		if (this.#resolved.has(key)) {
			return this.#resolved.get(key) as T;
		}
		const provider = this.#providers.get(key);
		if (!provider) return undefined;
		const value = provider.create();
		this.#resolved.set(key, value);
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
		if (this.#resolved.size === 0) return;

		let chain: Promise<void> | undefined;
		for (const [key, provider] of this.#providers) {
			if (provider.finalize && this.#resolved.has(key)) {
				const result = provider.finalize(this.#resolved.get(key));
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
	 * Returns the `BaseApp` instance stamped on the request by
	 * `BaseApp.render()`. Throws if the request has no attached app.
	 */
	get app(): BaseApp<any> {
		const app = Reflect.get(this.request, appSymbol) as BaseApp<any> | undefined;
		if (!app) {
			throw new Error(
				'FetchState.app accessed on a request without an attached app. ' +
					'Ensure it runs inside Astro\'s request pipeline.',
			);
		}
		return app;
	}

	/**
	 * Resolves the route to use for this request and stores it on
	 * `this.routeData`. If the adapter provided a `routeData` via render
	 * options it's used as-is. Otherwise we try the app's route matcher
	 * (dev or prod) and fall back to a `404.astro` route so middleware can
	 * still run.
	 *
	 * Once routeData is known, finalizes `this.pathname`: in dev, if the
	 * matched route has no `.html` extension, strip `.html` / `/index.html`
	 * suffixes so the render context sees the canonical pathname.
	 *
	 * Returns `true` when `this.routeData` is populated, or `false` when
	 * no route could be found (the caller should render a 404 error page).
	 */
	async resolveRouteData(): Promise<boolean> {
		const app = this.app;
		const request = this.request;

		if (!this.routeData) {
			if (app.isDev()) {
				const result = await app.devMatch(this.pathname);
				if (result) {
					this.routeData = result.routeData;
				}
			} else {
				this.routeData = app.match(request);
			}

			app.logger.debug('router', 'Astro matched the following route for ' + request.url);
			app.logger.debug('router', 'RouteData:\n' + this.routeData);
		}
		// At this point we haven't found a route that matches the request, so we create
		// a "fake" 404 route, so we can call the RenderContext.render
		// and hit the middleware, which might be able to return a correct Response.
		if (!this.routeData) {
			this.routeData = app.manifestData.routes.find(
				(route) => route.component === '404.astro' || route.component === DEFAULT_404_COMPONENT,
			);
		}
		if (!this.routeData) {
			app.logger.debug('router', "Astro hasn't found routes that match " + request.url);
			app.logger.debug('router', "Here's the available routes:\n", app.manifestData);
			return false;
		}
		// In dev, the route may have matched a normalized pathname (after .html stripping).
		// Skip normalization if the route already has an .html extension in its definition.
		if (app.isDev() && !routeHasHtmlExtension(this.routeData)) {
			this.pathname = this.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
		}
		return true;
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
	#computePathname(): string {
		const url = new URL(this.request.url);
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
	 * Recomputes `this.pathname` from `this.request`. Callers that need the
	 * `.html` / `/index.html` stripping applied after a rewrite should
	 * re-run that logic themselves (see `AstroHandler`).
	 */
	refreshPathname(): void {
		this.pathname = this.#computePathname();
	}

	/**
	 * Returns the resolved `props` for this render, computing them lazily
	 * from the route + component module on first access. If the
	 * `RenderContext` already carries user-supplied props (e.g. the
	 * container API) those are used verbatim.
	 *
	 * `state.renderContext` must be set before this is called.
	 */
	async getProps(): Promise<APIContext['props']> {
		if (this.props !== null) return this.props;
		const renderContext = this.renderContext!;
		if (Object.keys(renderContext.props).length > 0) {
			this.props = renderContext.props;
			return this.props;
		}
		const pipeline = this.pipeline;
		this.props = await getProps({
			mod: this.componentInstance,
			routeData: renderContext.routeData,
			routeCache: pipeline.routeCache,
			pathname: renderContext.pathname,
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
	 *
	 * Builds the context object directly and uses `Object.defineProperty`
	 * to add lazy getters for each registered provider, so `ctx.session`,
	 * `ctx.cache`, etc. are dynamic rather than hard-coded.
	 *
	 * `state.renderContext` must be set before this is called.
	 */
	getActionAPIContext(): ActionAPIContext {
		if (this.actionApiContext !== null) return this.actionApiContext;

		const renderContext = this.renderContext!;
		const { params, pipeline, url } = renderContext;

		// Cast to ActionAPIContext after adding dynamic provider getters.
		// Properties like session, cache, csp are defined via
		// defineProviderGetters below rather than statically.
		const ctx = {
			get cookies() {
				return renderContext.cookies;
			},
			routePattern: renderContext.routeData.route,
			isPrerendered: renderContext.routeData.prerender,
			get clientAddress() {
				return renderContext.getClientAddress();
			},
			get currentLocale() {
				return renderContext.computeCurrentLocale();
			},
			generator: ASTRO_GENERATOR,
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
			request: renderContext.request,
			site: pipeline.site,
			url,
			get originPathname() {
				return getOriginPathname(renderContext.request);
			},
			get csp() {
				return renderContext.getCsp();
			},
		};

		// Dynamically add lazy getters for each registered provider.
		// This is how ctx.session, ctx.cache, etc. are populated without
		// FetchState or RenderContext hard-coding the provider keys.
		this.defineProviderGetters(ctx);

		this.actionApiContext = ctx as ActionAPIContext;
		return this.actionApiContext;
	}

	/**
	 * Returns the `APIContext` for this render, creating it lazily from
	 * the memoized props + action context.
	 *
	 * Callers must ensure `getProps()` has resolved at least once before
	 * calling this; the props are derived asynchronously, and we keep
	 * `getAPIContext` synchronous so hot-path consumers don't pay for an
	 * extra microtask. `AstroMiddleware.handle` awaits `getProps()` first,
	 * so downstream middleware / page dispatch can call this sync.
	 */
	getAPIContext(): APIContext {
		if (this.apiContext !== null) return this.apiContext;

		const renderContext = this.renderContext!;
		const actionApiContext = this.getActionAPIContext();

		const redirect = (path: string, status = 302) =>
			new Response(null, { status, headers: { Location: path } });

		const rewrite = async (reroutePayload: RewritePayload) => {
			return await renderContext.rewrite(reroutePayload);
		};

		Reflect.set(actionApiContext, pipelineSymbol, renderContext.pipeline);
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
	 * call re-derives it from the (possibly mutated) `RenderContext`. Used
	 * after an in-flight rewrite swaps the `RenderContext`'s route /
	 * request / params.
	 */
	invalidateContexts(): void {
		this.props = null;
		this.actionApiContext = null;
		this.apiContext = null;
	}
}
