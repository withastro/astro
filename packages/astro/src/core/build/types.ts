import type * as vite from 'vite';
import type { InlineConfig } from 'vite';
import type { AstroSettings, ComponentInstance, RoutesList } from '../../types/astro.js';
import type { MiddlewareHandler } from '../../types/public/common.js';
import type { RuntimeMode } from '../../types/public/config.js';
import type { RouteData } from '../../types/public/internal.js';
import type { AstroLogger } from '../logger/core.js';

type ComponentPath = string;
export type ViteID = string;

export type StylesheetAsset =
	| { type: 'inline'; content: string }
	| { type: 'external'; src: string };

/** Public type exposed through the `astro:build:setup` integration hook */
export interface PageBuildData {
	key: string;
	component: ComponentPath;
	route: RouteData;
	moduleSpecifier: string;
	styles: Array<{ depth: number; order: number; sheet: StylesheetAsset }>;
}

export type AllPagesData = Record<ComponentPath, PageBuildData>;

export interface BuildOutputDirectories {
	client: URL;
	server: URL;
	prerender: URL;
}

/** Inputs available before Vite resolves its build environments. */
export interface StaticBuildOptionsInput {
	allPages: AllPagesData;
	settings: AstroSettings;
	logger: AstroLogger;
	routesList: RoutesList;
	runtimeMode: RuntimeMode;
	origin: string;
	pageNames: string[];
	viteConfig: InlineConfig;
	key: Promise<CryptoKey>;
	/** Set by `astro build --force` to rebuild every page and ignore the incremental cache. */
	force: boolean;
}

/** Options for build operations that require Vite's resolved output directories. */
export interface StaticBuildOptions extends StaticBuildOptionsInput {
	outputDirectories: BuildOutputDirectories;
}

type ImportComponentInstance = () => Promise<ComponentInstance>;

export interface SinglePageBuiltModule {
	page: ImportComponentInstance;
	/**
	 * The `onRequest` hook exported by the middleware
	 */
	onRequest?: MiddlewareHandler;
}

export type ViteBuildReturn = Awaited<ReturnType<typeof vite.build>>;
