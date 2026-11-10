import type { StylesheetAsset } from '@astrojs/vite-plugin-astro';
import type {
	PipelineModule,
	RoutingExtension,
	SSRManifestDataFields,
	SSRManifestExtensionFields,
} from '../../../index.js';
import type { RemotePattern } from '@astrojs/internal-helpers/remote';
import type {
	SSRComponentMetadata,
	SSRLoadedRenderer,
	SSRResult,
} from '@astrojs/vite-plugin-astro';
import type {
	CspAlgorithm,
	CspDirective,
	CspHashEntry,
	CspResourceEntry,
} from '@astrojs/runtime/_internal/core/csp/sources.js';
import type { ResolvedRouterPluginOptions } from '../../../options.js';
import type {
	AstroMiddlewareInstance,
	ComponentInstance,
	SerializedRouteData,
	SinglePageBuiltModule,
} from '../../../routing.js';
import type { RouteData, RuntimeMode } from '../../../types.js';
import type { Params } from '../../../routing.js';
import type { AstroCookies } from '../cookies/cookies.js';

declare module '@astrojs/vite-plugin-astro' {
	interface SSRResultExtensions {
		params: Params;
		request: Request;
		cookies: AstroCookies | undefined;
		/** @deprecated Use {@linkcode scriptDirective} instead. Holds the `default`-kind `script-src` hashes. */
		scriptHashes: SSRManifestCSP['scriptHashes'];
		/** @deprecated Use {@linkcode scriptDirective} instead. Holds the `default`-kind `script-src` resources. */
		scriptResources: SSRManifestCSP['scriptResources'];
		/** @deprecated Use {@linkcode styleDirective} instead. Holds the `default`-kind `style-src` hashes. */
		styleHashes: SSRManifestCSP['styleHashes'];
		/** @deprecated Use {@linkcode styleDirective} instead. Holds the `default`-kind `style-src` resources. */
		styleResources: SSRManifestCSP['styleResources'];
		/** @deprecated Use {@linkcode scriptDirective}'s `strictDynamic` instead. */
		isStrictDynamic: SSRManifestCSP['isStrictDynamic'];
	}
}
import type { AstroLoggerDestination, AstroLoggerLevel } from '../logger/core.js';
import type { BaseApp } from './base.js';

type ComponentPath = string;

export type { StylesheetAsset };

type ScriptAsset =
	| { children: string; stage: string }
	// Hoisted
	| { type: 'inline' | 'external'; value: string };

export interface RouteInfo {
	routeData: RouteData;
	file: string;
	links: string[];
	scripts: ScriptAsset[];
	styles: StylesheetAsset[];
}

export type SerializedRouteInfo = Omit<RouteInfo, 'routeData'> & {
	routeData: SerializedRouteData;
};

type ImportComponentInstance = () => Promise<SinglePageBuiltModule>;

export type ServerIslandMappings = {
	serverIslandMap?: Map<string, () => Promise<ComponentInstance>>;
	serverIslandNameMap?: Map<string, string>;
};

export type AssetsPrefix =
	| string
	| ({
			fallback: string;
	  } & Record<string, string>)
	| undefined;

export type SSRManifest = SSRManifestBase & SSRManifestExtensionFields & SSRManifestDataFields;

type SSRManifestBase = {
	adapterName: string;
	routes: RouteInfo[];
	site?: string;
	base: string;
	/**
	 * The base of the assets generated **by the user**. For example, scripts created by the user falls under this category.
	 *
	 * The value of this field comes from `vite.base`. We aren't usually this tight to vite in our code base, so probably
	 * this should be refactored somehow.
	 */
	userAssetsBase: string | undefined;
	trailingSlash: 'always' | 'never' | 'ignore';
	buildFormat: ResolvedRouterPluginOptions['build']['format'];
	/** `'development'` in the dev server, `'production'` in builds and at runtime after a build. */
	runtimeMode: RuntimeMode;
	compressHTML: boolean | 'jsx';
	assetsPrefix?: AssetsPrefix;
	renderers: SSRLoadedRenderer[];
	/**
	 * Based on Astro config's `output` option, `true` if "server" or "hybrid".
	 *
	 * Whether this application is SSR-like. If so, this has some implications, such as
	 * the creation of `dist/client` and `dist/server` folders.
	 */
	serverLike: boolean;
	/**
	 * The middleware mode determines when and how middleware executes.
	 * - 'classic' (default): Build-time for prerendered pages, request-time for SSR pages
	 * - 'edge': Middleware deployed as separate edge function
	 */
	middlewareMode: 'classic' | 'edge';
	/**
	 * Map of directive name (e.g. `load`) to the directive script code
	 */
	clientDirectives: Map<string, string>;
	entryModules: Record<string, string>;
	inlinedScripts: Map<string, string>;
	assets: Set<string>;
	componentMetadata: SSRResult['componentMetadata'];
	pageModule?: SinglePageBuiltModule;
	pageMap?: Map<ComponentPath, ImportComponentInstance>;
	serverIslandMappings?: () => Promise<ServerIslandMappings> | ServerIslandMappings;
	key: Promise<CryptoKey>;
	middleware?: () => Promise<AstroMiddlewareInstance> | AstroMiddlewareInstance;
	logger?: () => Promise<{ default: AstroLoggerDestination }> | { default: AstroLoggerDestination };
	/** Loads the fetch handlers and render context extensions registered with `api.astroRouter`. */
	pipeline?: () => Promise<PipelineModule> | PipelineModule;
	/** The modules registered with `api.astroRouter.extendRouting()`. */
	routing?: readonly RoutingExtension[];
	checkOrigin: boolean;
	allowedDomains?: Partial<RemotePattern>[];
	serverIslandBodySizeLimit: number;
	cacheDir: URL;
	srcDir: URL;
	outDir: URL;
	rootDir: URL;
	publicDir: URL;
	assetsDir: string;
	buildClientDir: URL;
	buildServerDir: URL;
	csp: SSRManifestCSP | undefined;
	shouldInjectCspMetaTags: boolean;
	devToolbar: {
		// This should always be false in prod/SSR
		enabled: boolean;
		/**
		 * Latest version of Astro, will be undefined if:
		 * - unable to check
		 * - the user has disabled the check
		 * - the check has not completed yet
		 * - the user is on the latest version already
		 */
		latestAstroVersion: string | undefined;
		debugInfoOutput: string | undefined;
		placement: 'bottom-left' | 'bottom-center' | 'bottom-right' | undefined;
	};
	internalFetchHeaders?: Record<string, string>;
	logLevel: AstroLoggerLevel;
};

/**
 * The CSP section of the manifest. It mirrors the `security.csp` config: `directives` plus a
 * `scriptDirective`/`styleDirective`, each holding `resources`/`hashes` entries that carry their
 * `kind` (`default`/`element`/`attribute`). The `kind` is only interpreted at render time. Astro's
 * generated hashes are appended to the relevant `hashes` array as `default`-kind entries.
 */
export type SSRManifestCSP = {
	cspDestination: 'adapter' | 'meta' | 'header' | undefined;
	algorithm: CspAlgorithm;
	directives: CspDirective[];
	/**
	 * @deprecated Use {@linkcode scriptDirective} instead. Holds the `default`-kind `script-src`
	 * hashes (the same values `scriptDirective.hashes` carries with `kind: "default"`).
	 */
	scriptHashes: string[];
	/**
	 * @deprecated Use {@linkcode scriptDirective} instead. Holds the `default`-kind `script-src`
	 * resources.
	 */
	scriptResources: string[];
	/**
	 * @deprecated Use {@linkcode scriptDirective}'s `strictDynamic` instead.
	 */
	isStrictDynamic: boolean;
	/**
	 * @deprecated Use {@linkcode styleDirective} instead. Holds the `default`-kind `style-src`
	 * hashes.
	 */
	styleHashes: string[];
	/**
	 * @deprecated Use {@linkcode styleDirective} instead. Holds the `default`-kind `style-src`
	 * resources.
	 */
	styleResources: string[];
	scriptDirective: {
		resources: CspResourceEntry[];
		hashes: CspHashEntry[];
		strictDynamic: boolean;
	};
	styleDirective: {
		resources: CspResourceEntry[];
		hashes: CspHashEntry[];
	};
	/** Static speculation rules JSON to inject in the head when CSP + clientPrerender are both enabled. */
	speculationRulesContent?: string;
	/** Import map JSON whose `integrity` map covers every client script, injected in the head when `strictDynamic` is enabled. */
	importMapContent?: string;
};

/** Public type exposed through the `astro:build:ssr` integration hook */
export type SerializedSSRManifest = Omit<
	SSRManifest,
	| 'middleware'
	| 'logger'
	| 'pipeline'
	| 'routing'
	| 'routes'
	| 'assets'
	| 'componentMetadata'
	| 'inlinedScripts'
	| 'clientDirectives'
	| 'serverIslandNameMap'
	| 'key'
	| 'rootDir'
	| 'srcDir'
	| 'cacheDir'
	| 'outDir'
	| 'publicDir'
	| 'buildClientDir'
	| 'buildServerDir'
> & {
	rootDir: string;
	srcDir: string;
	cacheDir: string;
	outDir: string;
	publicDir: string;
	/** The resolved Vite client output directory for this build. */
	buildClientDir: string;
	/** The resolved Vite SSR output directory for this build. */
	buildServerDir: string;
	routes: SerializedRouteInfo[];
	assets: string[];
	componentMetadata: [string, SSRComponentMetadata][];
	inlinedScripts: [string, string][];
	clientDirectives: [string, string][];
	key: string;
};

/** @deprecated This will be removed in a future major version. */
export type NodeAppHeadersJson = {
	pathname: string;
	headers: {
		key: string;
		value: string;
	}[];
}[];

export type CreateApp = (options?: { streaming?: boolean }) => BaseApp;
