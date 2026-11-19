/* eslint-disable @typescript-eslint/no-empty-object-type */

import type { SSRManifest } from './internal/core/app/types.js';
import type { FetchState } from './internal/core/fetch/fetch-state.js';
import type { AstroLogger } from './internal/core/logger/core.js';
import type { ErrorPayload as ViteErrorPayload } from 'vite';
/**
 * Types of the route table and of the runtime modules registered through `RouterPluginApi`.
 *
 * Registered runtime modules run in the server environment, not in the Vite plugin process, so
 * build-time registrations reference them by entrypoint and this module types their default
 * exports.
 */

import type { ViteBuilder } from 'vite';

export type ValidRedirectStatus = 300 | 301 | 302 | 303 | 304 | 307 | 308;

export type RedirectConfig =
	| string
	| {
			status: ValidRedirectStatus;
			destination: string;
	  };

/**
 * It contains the information about a route
 */
export interface RouteData {
	/**
	 * The current **pattern** of the route. For example:
	 * - `src/pages/index.astro` has a pattern of `/`
	 * - `src/pages/blog/[...slug].astro` has a pattern of `/blog/[...slug]`
	 * - `src/pages/site/[blog]/[...slug].astro` has a pattern of `/site/[blog]/[...slug]`
	 */
	route: string;
	/**
	 *  Source component URL
	 */
	component: string;
	/**
	 * Dynamic and spread route params
	 * ex. "/pages/[lang]/[...slug].astro" will output the params ['lang', '...slug']
	 */
	params: string[];
	/**
	 * Output URL pathname where this route will be served
	 * note: will be undefined for [dynamic] and [...spread] routes
	 */
	pathname?: string;
	/**
	 * The paths of the physical files emitted by this route. When a route **isn't** prerendered, the value is either `undefined` or an empty array.
	 */
	distURL: URL[];
	/**
	 *
	 * regex used for matching an input URL against a requested route
	 * ex. "[fruit]/about.astro" will generate the pattern: /^\/([^/]+?)\/about\/?$/
	 * where pattern.test("banana/about") is "true"
	 *
	 * ## Example
	 *
	 * ```js
	 * if (route.pattern.test('/blog')) {
	 *  // do something
	 * }
	 * ```
	 */
	pattern: RegExp;
	/**
	 * Similar to the "params" field, but with more associated metadata. For example, for `/site/[blog]/[...slug].astro`, the segments are:
	 *
	 * 1. `{ content: 'site', dynamic: false, spread: false }`
	 * 2. `{ content: 'blog', dynamic: true, spread: false }`
	 * 3. `{ content: '...slug', dynamic: true, spread: true }`
	 */
	segments: RoutePart[][];
	/**
	 *
	 * The type of the route. It can be:
	 * - `page`: a route that lives in the file system, usually an Astro component
	 * - `endpoint`: a route that lives in the file system, usually a JS file that exposes endpoints methods
	 * - `redirect`: a route points to another route that lives in the file system
	 * - `fallback`: a route that doesn't exist in the file system that needs to be handled with other means, usually the middleware
	 */
	type: RouteType;
	/**
	 * Whether the route is prerendered or not
	 */
	prerender: boolean;
	/**
	 * The route to redirect to. It holds information regarding the status code and its destination.
	 */
	redirect?: RedirectConfig;
	/**
	 * The {@link RouteData} to redirect to. It's present when `RouteData.type` is `redirect`.
	 */
	redirectRoute?: RouteData;
	/**
	 * A list of {@link RouteData} to fall back to. They are present when `i18n.fallback` has a list of locales.
	 */
	fallbackRoutes: RouteData[];

	/**
	 * If this route is a directory index
	 * For example:
	 * - src/pages/index.astro
	 * - src/pages/blog/index.astro
	 */
	isIndex: boolean;

	/**
	 * Whether the route comes from Astro core, an integration or the user's project
	 */
	origin: 'internal' | 'external' | 'project';
}

/**
 * - page: a route that lives in the file system, usually an Astro component
 * - endpoint: a route that lives in the file system, usually a JS file that exposes endpoints methods
 * - redirect: a route points to another route that lives in the file system
 * - fallback: a route that doesn't exist in the file system that needs to be handled with other means, usually the middleware
 */
export type RouteType = 'page' | 'endpoint' | 'redirect' | 'fallback';

export interface RoutePart {
	content: string;
	dynamic: boolean;
	spread: boolean;
}

/** Passed to `RouterPluginApi.transformRoutes()` callbacks. */
export interface RouteTransformContext {
	/** The base that route patterns (`RouteData.pattern`) are built with. */
	base: string;
	trailingSlash: 'always' | 'never' | 'ignore';
	/** The project root, with a trailing slash. */
	root: URL;
	/** The source directory, with a trailing slash. Pages live in its `pages/` directory. */
	srcDir: URL;
}

/**
 * A callback registered with `RouterPluginApi.transformRoutes()`. It may change `routes` in place
 * (add, remove or edit entries) or return a new array to replace it. It may throw to reject the
 * route table.
 */
export type RouteTransform = (
	routes: RouteData[],
	context: RouteTransformContext,
) => RouteData[] | void;

export interface InjectedRoute {
	pattern: string;
	entrypoint: string | URL;
	prerender?: boolean;
}

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

/** The per-request state passed to fetch handlers and render context extensions. */
export type RequestState = FetchState;

/** The server manifest. */
export type RouterManifest = SSRManifest;

/** The server runtime logger. */
export type RouterLogger = AstroLogger;

/**
 * Default export of a module registered with `RouterPluginApi.addFetchHandler()`.
 *
 * Receives the request state and `next`, which runs the rest of the pipeline, and returns the
 * response. A handler may return without calling `next` to short-circuit the pipeline.
 */
export type FetchPipelineHandler = (
	state: RequestState,
	next: (state: RequestState) => Promise<Response>,
) => Promise<Response>;

/**
 * Default export of a module registered with `RouterPluginApi.extendRenderContext()`.
 *
 * Called once per request, before any fetch handler runs. The provider's value is created on first
 * access of the registered key on the `Astro` global or the endpoint context, and finalized after
 * the response is produced. Returning `undefined` (or a promise of it) leaves the key unset for
 * this request: `Astro[key]` reads `undefined`.
 */
export type RenderContextExtension<T = any> = (
	state: RequestState,
) => ContextProvider<T> | undefined | Promise<ContextProvider<T> | undefined>;

/** A fetch handler as it appears in the server runtime, in registration order. */
export interface RegisteredFetchHandler {
	name: string;
	order: 'pre' | 'post';
	handler: FetchPipelineHandler;
}

/** A render context extension as it appears in the server runtime, in registration order. */
export interface RegisteredRenderContextExtension {
	key: string;
	extension: RenderContextExtension;
}

/**
 * The module generated from `addFetchHandler()` and `extendRenderContext()` registrations,
 * loaded by the server runtime through `manifest.pipeline`.
 */
export interface PipelineModule {
	fetchHandlers: readonly RegisteredFetchHandler[];
	renderContextExtensions: readonly RegisteredRenderContextExtension[];
}

/**
 * Lazily-loaded manifest entries registered with `RouterPluginApi.extendManifest()`, keyed by
 * manifest field. Each value is the type of the module's namespace object; the manifest exposes the
 * field as `() => Promise<Module>`. Extend through declaration merging.
 */
export interface SSRManifestExtensions {}

/**
 * The manifest fields generated from `SSRManifestExtensions`: each key is an optional loader of its
 * module. Loaders may return the module synchronously (hand-built manifests in tests do).
 */
export type SSRManifestExtensionFields = {
	[K in keyof SSRManifestExtensions]?: () =>
		| Promise<SSRManifestExtensions[K]>
		| SSRManifestExtensions[K];
};

/**
 * Static manifest entries registered with `RouterPluginApi.setManifestData()`, keyed by manifest
 * field. Values are serialized into the manifest as JSON. Extend through declaration merging.
 */
export interface SSRManifestData {}

/** The manifest fields generated from `SSRManifestData`; absent when not registered. */
export type SSRManifestDataFields = {
	[K in keyof SSRManifestData]?: SSRManifestData[K];
};

/**
 * Passed to `RoutingExtension` members. `manifest` is the server manifest; it carries the
 * `setManifestData()` entries.
 */
export interface RoutingExtensionContext {
	manifest: RouterManifest;
}

/**
 * Default export of a module registered with `RouterPluginApi.extendRouting()`. Every member is
 * optional and synchronous. When several extensions are registered, the first value other than
 * `undefined` that `resolvePathname` or `getErrorRoute` returns wins, and a route is an error page
 * when any `isErrorRoute` returns `true`.
 */
export interface RoutingExtension {
	/**
	 * Returns the pathname to match routes against, instead of the request URL's pathname (after
	 * `base` is removed), or `undefined` to keep it. Used for every request and by
	 * `App.match()`.
	 *
	 * @param pathname The pathname the request would be matched with. `undefined` when called from
	 *   `App.match()`, which only needs to know whether the extension changes the pathname.
	 */
	resolvePathname?(
		context: RoutingExtensionContext & {
			request: Request;
			url: URL;
			pathname: string | undefined;
			logger: RouterLogger;
		},
	): string | undefined;
	/**
	 * Returns the route (for example `/es/404`) of the error page for a pathname, or `undefined`
	 * to use `/404` or `/500`. Only called when the returned route exists.
	 */
	getErrorRoute?(
		context: RoutingExtensionContext & { pathname: string; status: 404 | 500 },
	): string | undefined;
	/** Whether `route` (for example `/es/404`) is an error page in addition to `/404` and `/500`. */
	isErrorRoute?(
		context: RoutingExtensionContext & { route: string; status: 404 | 500 },
	): boolean | undefined;
}

/**
 * A pathname with its associated route, used for prerendering.
 */
export interface PathWithRoute {
	pathname: string;
	route: RouteData;
	cacheKey?: string;
}

/**
 * Incremental-build data a prerenderer collects while rendering a page,
 * reported back to the build orchestrator so skipped pages can be tracked and
 * replayed without a re-render. This is the only attribution channel: every
 * prerenderer — in-process and out-of-process — collects in its own rendering
 * runtime and reports the result by value here.
 */
export interface PrerenderRenderMetadata<TImage = unknown> {
	/** Root-relative `filePath`s of the content entries the page rendered, or an empty array. */
	contentEntryKeys: string[];
	/** Optimized-image transforms the page resolved, or an empty array. */
	staticImages: TImage[];
	/** Absolute source paths of images the page referenced without a transform. */
	referencedImages?: string[];
}

/** Image data recorded while computing static paths, e.g. by `getImage()` in `getStaticPaths()`. */
export type StaticPathsMetadata<TImage = unknown> = Pick<
	PrerenderRenderMetadata<TImage>,
	'staticImages' | 'referencedImages'
>;

/** The paths a prerenderer's `getStaticPaths()` returns, with the images they resolved. */
export interface StaticPathsResult<TImage = unknown> {
	paths: PathWithRoute[];
	metadata?: StaticPathsMetadata<TImage>;
}

/**
 * The richer result a prerenderer's `render()` may return instead of a bare
 * `Response`, pairing the rendered response with the incremental-build metadata
 * collected for that page. `metadata` is `undefined` when the page was not
 * tracked (the prerenderer could not collect).
 */
export interface PrerenderResult<TImage = unknown> {
	response: Response;
	metadata?: PrerenderRenderMetadata<TImage>;
}

/**
 * Renders the static paths of a build. Adapters can provide one to control how pages are prerendered.
 * Allows non-Node runtimes (e.g., workerd) to handle prerendering.
 */
export interface Prerenderer<TImage = unknown> {
	name: string;
	/**
	 * Called once before prerendering starts. Use for setup like starting a preview server.
	 */
	setup?: () => Promise<void>;
	/**
	 * Returns pathnames with their routes to prerender. The route is included to avoid
	 * needing to re-match routes later, which can be incorrect due to route priority.
	 *
	 * Returning a bare array instead of a {@link StaticPathsResult} is deprecated.
	 */
	getStaticPaths: () => Promise<PathWithRoute[] | StaticPathsResult<TImage>>;
	/**
	 * Renders a single page. Called by Astro for each path returned by getStaticPaths.
	 * @param request - The request to render. The URL reflects the build format
	 *   (e.g. trailing slash for `directory` format). To get the canonical pathname,
	 *   use the `pathname` from the `PathWithRoute` entry returned by `getStaticPaths`.
	 * @param options - Render options
	 * @param options.routeData - The matched route for this path
	 * @param options.collectMetadata - Deprecated, always `true`.
	 *   The prerenderer should collect the page's per-render
	 *   incremental metadata in its rendering runtime and report it on a
	 *   {@link PrerenderResult}. A prerenderer that cannot collect may ignore the
	 *   flag and return a bare `Response`; its paths are then recorded as
	 *   "not tracked".
	 * @returns A {@link PrerenderResult}, whose metadata is reported to `onPrerenderDone()` callbacks.
	 *   Returning a bare `Response` is deprecated.
	 */
	render: (
		request: Request,
		options: { routeData: RouteData; collectMetadata?: boolean },
	) => Promise<Response | PrerenderResult<TImage>>;
	/**
	 * Called after all pages are prerendered and the `onPrerenderDone()` callbacks ran. Use for
	 * cleanup like stopping a preview server.
	 */
	teardown?: () => Promise<void>;
}

/**
 * Data recorded per prerendered path by the incremental build cache, keyed by feature. Extend
 * through declaration merging.
 */
export interface PrerenderPathMetadata {}

/** Passed to `RouterPluginApi.onPrerenderDone()` callbacks. */
export interface PrerenderDoneContext {
	/**
	 * The prerenderer that rendered the static paths, still set up. `undefined` when the build had
	 * no paths to prerender.
	 */
	prerenderer: Prerenderer | undefined;
	/**
	 * The metadata recorded while prerendering: by each rendered path, by `getStaticPaths()`, and
	 * outside of any render. Paths restored from the incremental build cache are reported to
	 * `onPrerenderPathRestored()` instead.
	 */
	metadata: Partial<PrerenderPathMetadata>[];
	/** The Vite builder of the production build. */
	builder: ViteBuilder;
	outputDirectories: BuildOutputDirectories;
}

/** The output directories Vite resolved for the client, server and prerender environments. */
export interface BuildOutputDirectories {
	client: URL;
	server: URL;
	prerender: URL;
}

/** Passed to `RouterPluginApi.onPrerenderPathRestored()` callbacks. */
export interface PrerenderPathRestoredContext {
	pathname: string;
	route: RouteData;
	/** The metadata the path recorded in the previous build. */
	metadata: Partial<PrerenderPathMetadata>;
}

/** The resolved `trailingSlash` option. */
export type TrailingSlash = 'always' | 'never' | 'ignore';

/** The resolved `build.format` option. */
export type BuildFormat = 'file' | 'directory' | 'preserve';

/** Whether the code runs in the dev server or in a build. */
export type RuntimeMode = 'development' | 'production';

/** A stylesheet of a route in dev, injected as a `<style>` tag and kept updated through Vite's client. */
export interface ImportedDevStyle {
	id: string;
	url: string;
	content: string;
}

/** An error thrown while rendering in dev, with Vite's error overlay metadata. */
export type SSRError = Error & ViteErrorPayload['err'];
