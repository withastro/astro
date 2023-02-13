import type { MarkdownRenderingOptions } from '@astrojs/markdown-remark';
import type {
	AstroConfig,
	ComponentInstance,
	PropagationHint,
	RouteData,
	SerializedRouteData,
	SSRLoadedRenderer,
	SSRResult,
} from '../../@types/astro';

export type ComponentPath = string;

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
}

export type SerializedRouteInfo = Omit<RouteInfo, 'routeData'> & {
	routeData: SerializedRouteData;
};

export interface SSRManifest {
	adapterName: string;
	routes: RouteInfo[];
	site?: string;
	base?: string;
	markdown: MarkdownRenderingOptions;
	pageMap: Map<ComponentPath, ComponentInstance>;
	renderers: SSRLoadedRenderer[];
	entryModules: Record<string, string>;
	assets: Set<string>;
	propagation: SSRResult['propagation'];
	trailingSlash: AstroConfig['trailingSlash'];
}

export type SerializedSSRManifest = Omit<SSRManifest, 'routes' | 'assets' | 'propagation'> & {
	routes: SerializedRouteInfo[];
	assets: string[];
	propagation: readonly [string, PropagationHint][];
};

export type AdapterCreateExports<T = any> = (
	manifest: SSRManifest,
	args?: T
) => Record<string, any>;
