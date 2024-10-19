import type {
	AstroMiddlewareInstance,
	ComponentInstance,
	Locales,
	RouteData,
	SSRComponentMetadata,
	SSRLoadedRenderer,
	SSRResult,
	SerializedRouteData,
} from '../../@types/astro.js';
import type { RoutingStrategies } from '../../i18n/utils.js';
import type { SinglePageBuiltModule } from '../build/types.js';

export type ComponentPath = string;

export type StylesheetAsset =
	| { type: 'inline'; content: string }
	| { type: 'external'; src: string };

export interface RouteInfo {
	routeData: RouteData;
	file: string;
	links: string[];
	scripts: // Integration injected
	(
		| { children: string; stage: string }
		// Hoisted
		| { type: 'inline' | 'external'; value: string }
	)[];
	styles: StylesheetAsset[];
}

export type SerializedRouteInfo = Omit<RouteInfo, 'routeData'> & {
	routeData: SerializedRouteData;
};

export type ImportComponentInstance = () => Promise<SinglePageBuiltModule>;

export type AssetsPrefix =
	| string
	| ({
			fallback: string;
	  } & Record<string, string>)
	| undefined;

export type SSRManifest = {
	hrefRoot: string;
	adapterName: string;
	routes: RouteInfo[];
	site?: string;
	base: string;
	trailingSlash: 'always' | 'never' | 'ignore';
	buildFormat: 'file' | 'directory' | 'preserve';
	compressHTML: boolean;
	assetsPrefix?: AssetsPrefix;
	renderers: SSRLoadedRenderer[];
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
	serverIslandMap?: Map<string, () => Promise<ComponentInstance>>;
	serverIslandNameMap?: Map<string, string>;
	key: Promise<CryptoKey>;
	i18n: SSRManifestI18n | undefined;
	middleware?: () => Promise<AstroMiddlewareInstance> | AstroMiddlewareInstance;
	checkOrigin: boolean;
	// TODO: remove experimental prefix
	experimentalEnvGetSecretEnabled: boolean;
};

export type SSRManifestI18n = {
	fallback: Record<string, string> | undefined;
	fallbackType: 'redirect' | 'rewrite';
	strategy: RoutingStrategies;
	locales: Locales;
	defaultLocale: string;
	domainLookupTable: Record<string, string>;
};

export type SerializedSSRManifest = Omit<
	SSRManifest,
	| 'middleware'
	| 'routes'
	| 'assets'
	| 'componentMetadata'
	| 'inlinedScripts'
	| 'clientDirectives'
	| 'serverIslandNameMap'
	| 'key'
> & {
	routes: SerializedRouteInfo[];
	assets: string[];
	componentMetadata: [string, SSRComponentMetadata][];
	inlinedScripts: [string, string][];
	clientDirectives: [string, string][];
	serverIslandNameMap: [string, string][];
	key: string;
};
