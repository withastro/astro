import type {
	AstroConfig,
	BuildConfig,
	ComponentInstance,
	ManifestData,
	RouteData,
	RuntimeMode,
	SSRLoadedRenderer,
} from '../../@types/astro';
import type { ViteConfigWithSSR } from '../create-vite';
import type { LogOptions } from '../logger/core';
import type { RouteCache } from '../render/route-cache';

export type ComponentPath = string;
export type ViteID = string;

export interface PageBuildData {
	component: ComponentPath;
	paths: string[];
	route: RouteData;
	moduleSpecifier: string;
	css: Set<string>;
	hoistedScript: { type: 'inline' | 'external'; value: string } | undefined;
}
export type AllPagesData = Record<ComponentPath, PageBuildData>;

/** Options for the static build */
export interface StaticBuildOptions {
	allPages: AllPagesData;
	astroConfig: AstroConfig;
	buildConfig: BuildConfig;
	logging: LogOptions;
	manifest: ManifestData;
	mode: RuntimeMode;
	origin: string;
	pageNames: string[];
	routeCache: RouteCache;
	viteConfig: ViteConfigWithSSR;
}

export interface SingleFileBuiltModule {
	pageMap: Map<ComponentPath, ComponentInstance>;
	renderers: SSRLoadedRenderer[];
}
