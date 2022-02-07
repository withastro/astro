import type { RouteData, SerializedRouteData, MarkdownRenderOptions } from '../../@types/astro';

export interface RouteInfo {
	routeData: RouteData
	file: string;
	links: string[];
	scripts: string[];
}

export type SerializedRouteInfo = Omit<RouteInfo, 'routeData'> & {
	routeData: SerializedRouteData;
}

export interface SSRManifest {
	routes: RouteInfo[];
	site?: string;
	markdown: {
		render: MarkdownRenderOptions
	},
	renderers: string[];
	entryModules: Record<string, string>;
}

export type SerializedSSRManifest = Omit<SSRManifest, 'routes'> & {
	routes: SerializedRouteInfo[];
}
