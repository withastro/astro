import type * as vite from 'vite';
import type { InlineConfig } from 'vite';
import type {
	AstroConfig,
	AstroSettings,
	ComponentInstance,
	ManifestData,
	MiddlewareHandler,
	RouteData,
	RuntimeMode,
	SSRLoadedRenderer,
} from '../../@types/astro.js';
import type { Logger } from '../logger/core.js';
import type { RouteCache } from '../render/route-cache.js';

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
	logger: Logger;
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
