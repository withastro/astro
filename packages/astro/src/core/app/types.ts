import type {
	Locales,
	RouteData,
	SerializedRouteData,
	SSRComponentMetadata,
	SSRLoadedRenderer,
	SSRResult,
} from '../../@types/astro.js';
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

export type SSRManifest = {
	adapterName: string;
	routes: RouteInfo[];
	site?: string;
	base: string;
	trailingSlash: 'always' | 'never' | 'ignore';
	compressHTML: boolean;
	assetsPrefix?: string;
	renderers: SSRLoadedRenderer[];
	/**
	 * Map of directive name (e.g. `load`) to the directive script code
	 */
	clientDirectives: Map<string, string>;
	entryModules: Record<string, string>;
	assets: Set<string>;
	componentMetadata: SSRResult['componentMetadata'];
	pageModule?: SinglePageBuiltModule;
	pageMap?: Map<ComponentPath, ImportComponentInstance>;
	i18n: SSRManifestI18n | undefined;
};

export type SSRManifestI18n = {
	fallback?: Record<string, string>;
	routing?: 'prefix-always' | 'prefix-other-locales';
	locales: Locales;
	defaultLocale: string;
};

export type SerializedSSRManifest = Omit<
	SSRManifest,
	'routes' | 'assets' | 'componentMetadata' | 'clientDirectives'
> & {
	routes: SerializedRouteInfo[];
	assets: string[];
	componentMetadata: [string, SSRComponentMetadata][];
	clientDirectives: [string, string][];
};
