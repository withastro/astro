import type { default as vite, InlineConfig } from 'vite';
import type {
	AstroConfig,
	AstroSettings,
	BuildConfig,
	ComponentInstance,
	ManifestData,
	MiddlewareHandler,
	RouteData,
	RuntimeMode,
	SSRLoadedRenderer,
} from '../../@types/astro';
import type { LogOptions } from '../logger/core';
import type { RouteCache } from '../render/route-cache';

export type ComponentPath = string;
export type ViteID = string;
export type PageOutput = AstroConfig['output'];

export type StylesheetAsset =
	| { type: 'inline'; content: string }
	| { type: 'external'; src: string };

export interface PageBuildData {
	component: ComponentPath;
	route: RouteData;
	moduleSpecifier: string;
	propagatedStyles: Map<string, Set<StylesheetAsset>>;
	propagatedScripts: Map<string, Set<string>>;
	hoistedScript: { type: 'inline' | 'external'; value: string } | undefined;
	styles: Array<{ depth: number; order: number; sheet: StylesheetAsset }>;
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
	teardownCompiler: boolean;
}

type ImportComponentInstance = () => Promise<ComponentInstance>;

export interface SinglePageBuiltModule {
	page: ImportComponentInstance;
	/**
	 * The `onRequest` hook exported by the middleware
	 */
	onRequest?: MiddlewareHandler<unknown>;
	renderers: SSRLoadedRenderer[];
}

export type ViteBuildReturn = Awaited<ReturnType<typeof vite.build>>;
export type RollupOutput = Extract<
	Extract<ViteBuildReturn, Exclude<ViteBuildReturn, Array<any>>>,
	{ output: any }
>;
export type OutputChunk = Extract<RollupOutput['output'][number], { type: 'chunk' }>;
