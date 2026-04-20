import {
	collapseDuplicateLeadingSlashes,
	prependForwardSlash,
	removeTrailingForwardSlash,
} from '@astrojs/internal-helpers/path';
import type { ActionAPIContext } from '../../actions/runtime/types.js';
import type { ComponentInstance } from '../../types/astro.js';
import type { APIContext } from '../../types/public/context.js';
import type { RouteData } from '../../types/public/internal.js';
import type { Pipeline } from '../base-pipeline.js';
import type { RenderContext } from '../render-context.js';
import { getProps } from '../render/index.js';
import type { ResolvedRenderOptions } from './base.js';
import { getRenderOptions } from './render-options.js';

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
	 * `state.renderContext` must be set before this is called.
	 */
	getActionAPIContext(): ActionAPIContext {
		if (this.actionApiContext !== null) return this.actionApiContext;
		this.actionApiContext = this.renderContext!.createActionAPIContext();
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
		this.apiContext = this.renderContext!.createAPIContext(
			this.props!,
			this.getActionAPIContext(),
		);
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
