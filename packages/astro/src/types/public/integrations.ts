import type { AddressInfo } from 'node:net';
import type { ViteDevServer, InlineConfig as ViteInlineConfig } from 'vite';
import type { SerializedSSRManifest } from '../../core/app/types.js';
import type { AssetsGlobalStaticImagesList } from '../../assets/types.js';
import type { PageBuildData } from '../../core/build/types.js';
import type { AstroIntegrationLogger } from '../../core/logger/core.js';
import type { AdapterFeatureStability } from '../../integrations/features-validation.js';
import type { getToolbarServerCommunicationHelpers } from '../../integrations/hooks.js';
import type { DeepPartial } from '../../type-utils.js';
import type { AstroConfig } from './config.js';
import type { RefreshContentOptions } from './content.js';
import type { InternalInjectedRoute, RouteData } from './internal.js';
import type { DevToolbarAppEntry } from './toolbar.js';

export interface RouteOptions {
	/**
	 * The path to this route relative to the project root. The slash is normalized as forward slash
	 * across all OS.
	 * @example "src/pages/blog/[...slug].astro"
	 */
	readonly component: string;
	/**
	 * Whether this route should be prerendered. If the route has an explicit `prerender` export,
	 * the value will be passed here. Otherwise, it's undefined and will fallback to a prerender
	 * default depending on the `output` option.
	 */
	prerender?: boolean;
}

/* Client Directives */
type DirectiveHydrate = () => Promise<void>;
type DirectiveLoad = () => Promise<DirectiveHydrate>;

type DirectiveOptions = {
	/**
	 * The component displayName
	 */
	name: string;
	/**
	 * The attribute value provided
	 */
	value: string;
};

export type ClientDirective = (
	load: DirectiveLoad,
	options: DirectiveOptions,
	el: HTMLElement,
) => void;

export interface ClientDirectiveConfig {
	name: string;
	entrypoint: string | URL;
}

export interface AstroRenderer {
	/** Name of the renderer. */
	name: string;
	/** Import entrypoint for the client/browser renderer. */
	clientEntrypoint?: string | URL;
	/** Import entrypoint for the server/build/ssr renderer. */
	serverEntrypoint: string | URL;
}

export type AdapterSupportsKind =
	(typeof AdapterFeatureStability)[keyof typeof AdapterFeatureStability];

export type AdapterSupportWithMessage = {
	support: Exclude<AdapterSupportsKind, 'stable'>;
	message: string;
	/**
	 * Determines if a feature support warning/error in the adapter should be suppressed:
	 * - `"default"`: Suppresses the default warning/error message.
	 * - `"all"`: Suppresses both the custom and the default warning/error message.
	 *
	 * This is useful when the warning/error might not be applicable in certain contexts,
	 * or the default message might cause confusion and conflict with a custom one.
	 */
	suppress?: 'all' | 'default';
};

export type AdapterSupport = AdapterSupportsKind | AdapterSupportWithMessage;

export type MiddlewareMode = 'classic' | 'edge';

export interface AstroAdapterFeatures {
	/**
	 * Creates an edge function that will communicate with the Astro middleware
	 *
	 * @deprecated Use `middlewareMode: 'edge'` instead
	 */
	edgeMiddleware?: boolean;

	/**
	 * Determines when and how middleware executes:
	 * - `'classic'` (default): Middleware runs for prerendered pages at build time, and for SSR pages at request time. Does not run for prerendered pages at request time.
	 * - `'edge'`: Middleware is deployed as a separate edge function. Middleware code will not be bundled and imported by all pages during the build.
	 *
	 * @default 'classic'
	 */
	middlewareMode?: MiddlewareMode;

	/**
	 * Allows you to force a specific output shape for the build. This can be useful for adapters that only work with
	 * a specific output type. For example, your adapter might expect a static website so it can create host-specific
	 * files. Defaults to `server` if not specified.
	 */
	buildOutput?: 'static' | 'server';

	/**
	 * Whether or not the adapter provides support for setting response headers for static pages. When this feature is
	 * enabled, Astro will return a map of the `Headers` emitted by the static pages. This map is available as `routeToHeaders`
	 * in the `astro:build:generated` hook and can be used to generate platform-specific output that controls HTTP headers,
	 * for example, to create a `_headers` file for platforms that support it.
	 */
	staticHeaders?: boolean;
}

/**
 * @internal
 * Configuration for Astro's client-side code from adapters.
 * This is used internally to inject adapter-specific behavior into client code.
 */
export interface AstroAdapterClientConfig {
	/**
	 * Headers to inject into Astro's internal fetch calls (Actions, View Transitions, Server Islands, Prefetch).
	 * Can be an object of headers or a function that returns headers.
	 */
	internalFetchHeaders?: Record<string, string> | (() => Record<string, string>);

	/**
	 * Query parameters to append to all asset URLs (images, stylesheets, scripts, etc.).
	 * Useful for adapters that need to track deployment versions or other metadata.
	 */
	assetQueryParams?: URLSearchParams;
}

interface AdapterExplicitProperties {
	/**
	 * @deprecated `entrypointResolution: "explicit"` is deprecated. `entrypointResolution: "auto"` will become the default,
	 * and only, behavior in a future major version. See [how to migrate](https://v6.docs.astro.build/en/guides/upgrade-to/v6/#deprecated-createexports-and-start-adapter-api).
	 *
	 * Specifies the method Astro will use to resolve the server entrypoint: `"auto"` (recommended)
	 * or `"explicit"` (default, but deprecated):
	 *
	 * - **`"auto"` (recommended):** You are responsible for providing a valid module as an entrypoint
	 * using either `serverEntrypoint` or, if you need further customization at the Vite level using `vite.build.rollupOptions.input`.
	 * - **`"explicit"` (deprecated)**: You must provide the exports required by the host in the server entrypoint
	 * using a `createExports()` function before passing them to `setAdapter()` as an [`exports`](#exports) list. This supports
	 * adapters built using the Astro 5 version of the Adapter API. By default, all adapters will receive this value to allow backwards
	 * compatibility. **However, no new adapters should be created with this value.** Existing adapters should override this default
	 * value with `"auto"` as soon as they are able to migrate to the new v6 API.
	 */
	entrypointResolution?: 'explicit';

	/**
	 * Defines the entrypoint for on-demand rendering.
	 */
	serverEntrypoint?: string | URL;

	/**
	 * @deprecated This will be removed in a future major version, alongside `entrypointResolution: 'explicit'`.
	 *
	 * Defines an array of named exports to use in conjunction with the `createExports()` function of your server entrypoint.
	 */
	exports?: string[];

	/**
	 * @deprecated This will be removed in a future major version, alongside `entrypointResolution: 'explicit'`.
	 *
	 * A JSON-serializable value that will be passed to the adapter's server entrypoint at runtime. This is useful to pass an object containing build-time configuration (e.g. paths, secrets) to your server runtime code.
	 */
	args?: any;
}

interface AdapterAutoProperties {
	/**
	 * Specifies the method Astro will use to resolve the server entrypoint: `"auto"` (recommended)
	 * or `"explicit"` (default, but deprecated):
	 *
	 * - **`"auto"` (recommended):** You are responsible for providing a valid module as an entrypoint
	 * using either `serverEntrypoint` or, if you need further customization at the Vite level using `vite.build.rollupOptions.input`.
	 * - **`"explicit"` (deprecated)**: You must provide the exports required by the host in the server entrypoint
	 * using a `createExports()` function before passing them to `setAdapter()` as an [`exports`](#exports) list. This supports
	 * adapters built using the Astro 5 version of the Adapter API. By default, all adapters will receive this value to allow backwards
	 * compatibility. **However, no new adapters should be created with this value.** Existing adapters should override this default
	 * value with `"auto"` as soon as they are able to migrate to the new v6 API.
	 */
	entrypointResolution: 'auto';

	/**
	 * Defines the entrypoint for on-demand rendering.
	 */
	serverEntrypoint?: string | URL;
}

export type AstroAdapter = {
	/**
	 * Defines a unique name for your adapter. This will be used for logging.
	 */
	name: string;

	/**
	 * Defines the path or ID of a module in the adapter's package that is responsible for starting up the built
	 * server when `astro preview` is run.
	 */
	previewEntrypoint?: string | URL;

	/**
	 * An object that specifies which adapter features that change the build output are supported by the adapter.
	 */
	adapterFeatures?: AstroAdapterFeatures;

	/**
	 * A map of Astro's built-in features supported by the adapter. This allows Astro to determine which features an
	 * adapter supports, so appropriate error messages can be provided.
	 */
	supportedAstroFeatures: AstroAdapterFeatureMap;

	/**
	 * A configuration object for Astro's client-side code.
	 */
	client?: AstroAdapterClientConfig;
} & (AdapterExplicitProperties | AdapterAutoProperties);

/**
 * A pathname with its associated route, used for prerendering.
 */
export interface PathWithRoute {
	pathname: string;
	route: RouteData;
}

/**
 * Custom prerenderer that adapters can provide to control how pages are prerendered.
 * Allows non-Node runtimes (e.g., workerd) to handle prerendering.
 */
export interface AstroPrerenderer {
	name: string;
	/**
	 * Called once before prerendering starts. Use for setup like starting a preview server.
	 */
	setup?: () => Promise<void>;
	/**
	 * Returns pathnames with their routes to prerender. The route is included to avoid
	 * needing to re-match routes later, which can be incorrect due to route priority.
	 */
	getStaticPaths: () => Promise<PathWithRoute[]>;
	/**
	 * Renders a single page. Called by Astro for each path returned by getStaticPaths.
	 * @param request - The request to render
	 * @param options - Render options including routeData
	 */
	render: (request: Request, options: { routeData: RouteData }) => Promise<Response>;
	/**
	 * Returns images collected in the adapter's runtime (e.g. workerd) to be merged
	 * into the Node-side static image list. The default Sharp pipeline runs after.
	 */
	collectStaticImages?: () => Promise<AssetsGlobalStaticImagesList>;
	/**
	 * Called after all pages are prerendered. Use for cleanup like stopping a preview server.
	 */
	teardown?: () => Promise<void>;
}

export type AstroAdapterFeatureMap = {
	/**
	 * Defines whether the adapter is able to serve static pages.
	 */
	staticOutput?: AdapterSupport;

	/**
	 * Defines whether the adapter is able to serve sites that include a mix of static and on-demand rendered pages.
	 */
	hybridOutput?: AdapterSupport;

	/**
	 * Defines whether the adapter is able to serve on-demand rendered pages.
	 */
	serverOutput?: AdapterSupport;

	/**
	 * Defines whether the adapter is able to support i18n domains.
	 */
	i18nDomains?: AdapterSupport;

	/**
	 * Defines whether the adapter is able to support `getSecret()` exported from `astro:env/server`. When enabled, this feature
	 * allows your adapter to retrieve secrets configured by users in `env.schema`.
	 *
	 * The `astro/env/setup` module allows you to provide an implementation for `getSecret()`. In your server entrypoint, call
	 * `setGetEnv()` as soon as possible.
	 */
	envGetSecret?: AdapterSupport;

	/**
	 * Defines whether the adapter supports image transformation using the built-in Sharp image service.
	 */
	sharpImageService?: AdapterSupport;
};

/**
 * IDs for different stages of JS script injection:
 * - "before-hydration": Imported client-side, before the hydration script runs. Processed & resolved by Vite.
 * - "head-inline": Injected into a script tag in the `<head>` of every page. Not processed or resolved by Vite.
 * - "page": Injected into the JavaScript bundle of every page. Processed & resolved by Vite.
 * - "page-ssr": Injected into the frontmatter of every Astro page. Processed & resolved by Vite.
 */
export type InjectedScriptStage = 'before-hydration' | 'head-inline' | 'page' | 'page-ssr';

export type InjectedRoute = Omit<InternalInjectedRoute, 'origin'>;

export interface InjectedType {
	filename: string;
	content: string;
}

export type AstroIntegrationMiddleware = {
	order: 'pre' | 'post';
	entrypoint: string | URL;
};

export type HookParameters<
	Hook extends keyof AstroIntegration['hooks'],
	Fn = AstroIntegration['hooks'][Hook],
> = Fn extends (...args: any) => any ? Parameters<Fn>[0] : never;

export interface BaseIntegrationHooks {
	'astro:config:setup': (options: {
		config: AstroConfig;
		command: 'dev' | 'build' | 'preview' | 'sync';
		isRestart: boolean;
		updateConfig: (newConfig: DeepPartial<AstroConfig>) => AstroConfig;
		addRenderer: (renderer: AstroRenderer) => void;
		addWatchFile: (path: URL | string) => void;
		injectScript: (stage: InjectedScriptStage, content: string) => void;
		injectRoute: (injectRoute: InjectedRoute) => void;
		addClientDirective: (directive: ClientDirectiveConfig) => void;
		addDevToolbarApp: (entrypoint: DevToolbarAppEntry) => void;
		addMiddleware: (mid: AstroIntegrationMiddleware) => void;
		createCodegenDir: () => URL;
		logger: AstroIntegrationLogger;
	}) => void | Promise<void>;
	'astro:config:done': (options: {
		config: AstroConfig;
		setAdapter: (adapter: AstroAdapter) => void;
		injectTypes: (injectedType: InjectedType) => URL;
		logger: AstroIntegrationLogger;
		buildOutput: 'static' | 'server';
	}) => void | Promise<void>;
	'astro:server:setup': (options: {
		server: ViteDevServer;
		logger: AstroIntegrationLogger;
		toolbar: ReturnType<typeof getToolbarServerCommunicationHelpers>;
		refreshContent?: (options: RefreshContentOptions) => Promise<void>;
	}) => void | Promise<void>;
	'astro:server:start': (options: {
		address: AddressInfo;
		logger: AstroIntegrationLogger;
	}) => void | Promise<void>;
	'astro:server:done': (options: { logger: AstroIntegrationLogger }) => void | Promise<void>;
	'astro:build:ssr': (options: {
		manifest: SerializedSSRManifest;
		/**
		 * File path of the emitted middleware
		 */
		middlewareEntryPoint: URL | undefined;
		logger: AstroIntegrationLogger;
	}) => void | Promise<void>;
	'astro:build:start': (options: {
		logger: AstroIntegrationLogger;
		setPrerenderer: (
			prerenderer: AstroPrerenderer | ((defaultPrerenderer: AstroPrerenderer) => AstroPrerenderer),
		) => void;
	}) => void | Promise<void>;
	'astro:build:setup': (options: {
		vite: ViteInlineConfig;
		pages: Map<string, PageBuildData>;
		target: 'client' | 'server';
		updateConfig: (newConfig: ViteInlineConfig) => void;
		logger: AstroIntegrationLogger;
	}) => void | Promise<void>;
	'astro:build:generated': (options: {
		dir: URL;
		logger: AstroIntegrationLogger;
		routeToHeaders: RouteToHeaders;
	}) => void | Promise<void>;
	'astro:build:done': (options: {
		pages: { pathname: string }[];
		dir: URL;
		assets: Map<string, URL[]>;
		logger: AstroIntegrationLogger;
	}) => void | Promise<void>;
	'astro:route:setup': (options: {
		route: RouteOptions;
		logger: AstroIntegrationLogger;
	}) => void | Promise<void>;
	'astro:routes:resolved': (options: {
		routes: IntegrationResolvedRoute[];
		logger: AstroIntegrationLogger;
	}) => void | Promise<void>;
}

export interface AstroIntegration {
	/** The name of the integration. */
	name: string;
	/** The different hooks available to extend. */
	hooks: {
		[K in keyof Astro.IntegrationHooks]?: Astro.IntegrationHooks[K];
	} & Partial<Record<string, unknown>>;
}

export type RouteToHeaders = Map<string, HeaderPayload>;

export type HeaderPayload = {
	headers: Headers;
	route: IntegrationResolvedRoute;
};

export interface IntegrationResolvedRoute
	extends Pick<RouteData, 'params' | 'pathname' | 'segments' | 'type' | 'redirect' | 'origin'> {
	/**
	 * {@link RouteData.route}
	 */
	pattern: RouteData['route'];

	/**
	 * {@link RouteData.pattern}
	 */
	patternRegex: RouteData['pattern'];

	/**
	 * {@link RouteData.component}
	 */
	entrypoint: RouteData['component'];

	/**
	 * {@link RouteData.prerender}
	 */
	isPrerendered: RouteData['prerender'];

	/**
	 * {@link RouteData.redirectRoute}
	 */
	redirectRoute?: IntegrationResolvedRoute;

	/**
	 * @param {any} data The optional parameters of the route
	 *
	 * @description
	 * A function that accepts a list of params, interpolates them with the route pattern, and returns the path name of the route.
	 *
	 * ## Example
	 *
	 * For a route such as `/blog/[...id].astro`, the `generate` function would return something like this:
	 *
	 * ```js
	 * console.log(generate({ id: 'presentation' })) // will log `/blog/presentation`
	 * ```
	 */
	generate: (data?: any) => string;
}
