import type { ComponentPreload } from '../render/dev/index';
import type { AstroConfig, BuildConfig, ManifestData, RouteData } from '../../@types/astro';
import type { ViteConfigWithSSR } from '../../create-vite';
import type { LogOptions } from '../../logger';
import type { RouteCache } from '../../render/route-cache.js';

export interface PageBuildData {
	paths: string[];
	preload: ComponentPreload;
	route: RouteData;
}
export type AllPagesData = Record<string, PageBuildData>;

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
