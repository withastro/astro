import type * as vite from 'vite';
import type { InlineConfig } from 'vite';
import type {
	AstroSettings,
	ComponentInstance,
	ManifestData,
	MiddlewareHandler,
	RouteData,
	RuntimeMode,
	SSRLoadedRenderer,
} from '../../@types/astro.js';
import type { Logger } from '../logger/core.js';

export type ComponentPath = string;
export type ViteID = string;

export type StylesheetAsset =
	| { type: 'inline'; content: string }
	| { type: 'external'; src: string };

export type HoistedScriptAsset = { type: 'inline' | 'external'; value: string };

export interface PageBuildData {
	key: string;
	component: ComponentPath;
	route: RouteData;
	moduleSpecifier: string;
	hoistedScript: HoistedScriptAsset | undefined;
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
	viteConfig: InlineConfig;
	teardownCompiler: boolean;
	key: Promise<CryptoKey>;
}

type ImportComponentInstance = () => Promise<ComponentInstance>;

export interface SinglePageBuiltModule {
	page: ImportComponentInstance;
	/**
	 * The `onRequest` hook exported by the middleware
	 */
	onRequest?: MiddlewareHandler;
	renderers: SSRLoadedRenderer[];
}

export type ViteBuildReturn = Awaited<ReturnType<typeof vite.build>>;
