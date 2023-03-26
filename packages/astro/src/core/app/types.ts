import type { MarkdownRenderingOptions } from '@astrojs/markdown-remark';
import type {
	AstroMiddlewareInstance,
	ComponentInstance,
	RouteData,
	SerializedRouteData,
	SSRComponentMetadata,
	SSRLoadedRenderer,
	SSRResult,
} from '../../@types/astro';

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

export interface SSRManifest {
	adapterName: string;
	routes: RouteInfo[];
	site?: string;
	base?: string;
	assetsPrefix?: string;
	markdown: MarkdownRenderingOptions;
	pageMap: Map<ComponentPath, ComponentInstance>;
	renderers: SSRLoadedRenderer[];
	entryModules: Record<string, string>;
	assets: Set<string>;
	componentMetadata: SSRResult['componentMetadata'];
	middleware?: AstroMiddlewareInstance<unknown>;
}

export type SerializedSSRManifest = Omit<SSRManifest, 'routes' | 'assets' | 'componentMetadata'> & {
	routes: SerializedRouteInfo[];
	assets: string[];
	componentMetadata: [string, SSRComponentMetadata][];
};

export type AdapterCreateExports<T = any> = (
	manifest: SSRManifest,
	args?: T
) => Record<string, any>;
