import type { ComponentPreload } from '../render/dev/index';
import type {
	AstroConfig,
	BuildConfig,
	ManifestData,
	RouteData,
	ComponentInstance,
	SSRLoadedRenderer,
} from '../../@types/astro';
import type { ViteConfigWithSSR } from '../../create-vite';
import type { LogOptions } from '../../logger';
import type { RouteCache } from '../../render/route-cache.js';

export type ComponentPath = string;
export type ViteID = string;

export interface PageBuildData {
	component: ComponentPath;
	paths: string[];
	preload: ComponentPreload;
	route: RouteData;
	moduleSpecifier: string;
	css: Set<string>;
	hoistedScript: string | undefined;
	scripts: Set<string>;
}
export type AllPagesData = Record<ComponentPath, PageBuildData>;

/** Options for the static build */
export interface StaticBuildOptions {
	allPages: AllPagesData;
	astroConfig: AstroConfig;
	buildConfig: BuildConfig;
	logging: LogOptions;
	manifest: ManifestData;
	origin: string;
	pageNames: string[];
	routeCache: RouteCache;
	viteConfig: ViteConfigWithSSR;
}

export interface SingleFileBuiltModule {
	pageMap: Map<ComponentPath, ComponentInstance>;
	renderers: SSRLoadedRenderer[];
}
