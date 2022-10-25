import type { InlineConfig } from 'vite';
import type {
	AstroConfig,
	AstroSettings,
	BuildConfig,
	ComponentInstance,
	ManifestData,
	RouteData,
	RuntimeMode,
	SSRLoadedRenderer,
} from '../../@types/astro';
import type { LogOptions } from '../logger/core';
import type { RouteCache } from '../render/route-cache';

export type ComponentPath = string;
export type ViteID = string;
export type PageBuildOutput = Omit<AstroConfig['output'], 'hybrid'>

export interface PageBuildData {
	component: ComponentPath;
	route: RouteData;
	moduleSpecifier: string;
	css: Map<string, { depth: number; order: number }>;
	hoistedScript: { type: 'inline' | 'external'; value: string } | undefined;
	output: PageBuildOutput
}
export type AllPagesData = Record<ComponentPath, PageBuildData>;

/** Options for the static build */
export interface StaticBuildOptions {
	allPages: AllPagesData;
	settings: AstroSettings;
	buildConfig: BuildConfig;
	logging: LogOptions;
	manifest: ManifestData;
	mode: RuntimeMode;
	origin: string;
	pageNames: string[];
	routeCache: RouteCache;
	viteConfig: InlineConfig;
}

export interface SingleFileBuiltModule {
	pageMap: Map<ComponentPath, ComponentInstance>;
	renderers: SSRLoadedRenderer[];
}
