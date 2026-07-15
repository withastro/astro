import type { ActionClient } from '../../actions/runtime/types.js';
import type { ComponentInstance, SerializedRouteData } from '../../types/astro.js';
import type { AstroMiddlewareInstance } from '../../types/public/common.js';
import type {
	AstroConfig,
	CspAlgorithm,
	Locales,
	RemotePattern,
} from '../../types/public/config.js';
import type {
	RouteData,
	SSRComponentMetadata,
	SSRLoadedRenderer,
	SSRResult,
} from '../../types/public/internal.js';
import type { SinglePageBuiltModule } from '../build/types.js';
import type { AstroLoggerDestination, AstroLoggerLevel } from '../logger/core.js';
import type { CspDirective, CspHashEntry, CspResourceEntry } from '../csp/config.js';
import type { RoutingStrategies } from './common.js';
import type { CacheProviderFactory, SSRManifestCache } from '../cache/types.js';
import type { BaseSessionConfig, SessionDriverFactory } from '../session/types.js';
import type { DevToolbarPlacement } from '../../types/public/toolbar.js';
import type { MiddlewareMode } from '../../types/public/integrations.js';
import type { BaseApp } from './base.js';
import type { LoggerHandlerConfig } from '../logger/config.js';

type ComponentPath = string;

export type StylesheetAsset =
	| { type: 'inline'; content: string }
	| { type: 'external'; src: string };

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

export type SSRManifest = {
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
	trailingSlash: AstroConfig['trailingSlash'];
	buildFormat: NonNullable<AstroConfig['build']>['format'];
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
	middlewareMode: MiddlewareMode;
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
	i18n: SSRManifestI18n | undefined;
	middleware?: () => Promise<AstroMiddlewareInstance> | AstroMiddlewareInstance;
	logger?: () => Promise<{ default: AstroLoggerDestination }> | { default: AstroLoggerDestination };
	actions?: () => Promise<SSRActions> | SSRActions;
	sessionDriver?: () => Promise<{ default: SessionDriverFactory | null }>;
	cacheProvider?: () => Promise<{ default: CacheProviderFactory | null }>;
	checkOrigin: boolean;
	allowedDomains?: Partial<RemotePattern>[];
	actionBodySizeLimit: number;
	serverIslandBodySizeLimit: number;
	sessionConfig?: SSRManifestSession;
	cacheConfig?: SSRManifestCache;
	cacheDir: URL;
	srcDir: URL;
	outDir: URL;
	rootDir: URL;
	publicDir: URL;
	assetsDir: string;
	buildClientDir: URL;
	buildServerDir: URL;
	csp: SSRManifestCSP | undefined;
	image: {
		objectFit?: string;
		objectPosition?: string;
		layout?: string;
	};
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
		placement: DevToolbarPlacement | undefined;
	};
	internalFetchHeaders?: Record<string, string>;
	logLevel: AstroLoggerLevel;
	// Configuration that tells us how to load the logger
	loggerConfig: LoggerHandlerConfig | undefined;
};

export type SSRActions = {
	server: Record<string, ActionClient<any, any, any>>;
};

export type SSRManifestI18n = {
	fallback: Record<string, string> | undefined;
	fallbackType: 'redirect' | 'rewrite';
	strategy: RoutingStrategies;
	locales: Locales;
	defaultLocale: string;
	domainLookupTable: Record<string, string>;
	domains: Record<string, string> | undefined;
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
};

export interface SSRManifestSession extends BaseSessionConfig {
	driver: string;
	options?: Record<string, any> | undefined;
}

/** Public type exposed through the `astro:build:ssr` integration hook */
export type SerializedSSRManifest = Omit<
	SSRManifest,
	| 'middleware'
	| 'logger'
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
	buildClientDir: string;
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
