import type { MarkdownRenderingOptions } from '@astrojs/markdown-remark';
import type {
	RouteData,
	SerializedRouteData,
	SSRComponentMetadata,
	SSRLoadedRenderer,
	SSRResult,
} from '../../@types/astro';
import type { SinglePageBuiltModule } from '../build/types';

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

export type SSRBaseManifest = SSRServerManifest | SSRSplitManifest;

export type SSRServerManifest = {
	adapterName: string;
	routes: RouteInfo[];
	site?: string;
	base?: string;
	assetsPrefix?: string;
	markdown: MarkdownRenderingOptions;
	renderers: SSRLoadedRenderer[];
	/**
	 * Map of directive name (e.g. `load`) to the directive script code
	 */
	clientDirectives: Map<string, string>;
	entryModules: Record<string, string>;
	assets: Set<string>;
	componentMetadata: SSRResult['componentMetadata'];
	pageModule?: undefined;
	pageMap: Map<ComponentPath, ImportComponentInstance>;
};

export type SSRSplitManifest = {
	adapterName: string;
	routes: RouteInfo[];
	site?: string;
	base?: string;
	assetsPrefix?: string;
	markdown: MarkdownRenderingOptions;
	renderers: SSRLoadedRenderer[];
	/**
	 * Map of directive name (e.g. `load`) to the directive script code
	 */
	clientDirectives: Map<string, string>;
	entryModules: Record<string, string>;
	assets: Set<string>;
	componentMetadata: SSRResult['componentMetadata'];
	pageModule: SinglePageBuiltModule;
	pageMap?: undefined;
};

export type SerializedSSRManifest = Omit<
	SSRBaseManifest,
	'routes' | 'assets' | 'componentMetadata' | 'clientDirectives'
> & {
	routes: SerializedRouteInfo[];
	assets: string[];
	componentMetadata: [string, SSRComponentMetadata][];
	clientDirectives: [string, string][];
};

export type AdapterCreateExports<T = any> = (
	manifest: SSRBaseManifest,
	args?: T
) => Record<string, any>;
