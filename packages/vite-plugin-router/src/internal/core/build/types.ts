import type * as vite from 'vite';
import type { InlineConfig } from 'vite';
import type { AstroRenderer } from '@astrojs/vite-plugin-astro';
import type { BuildOutputDirectories, RouterConfig, Prerenderer } from '../../../index.js';
import type { SerializedSSRManifest } from '../app/types.js';
import type { RoutesList } from '../../../index.js';
import type { RuntimeMode } from '../../../index.js';
import type { RouteData } from '../../../index.js';
import type { AstroLogger } from '../logger/core.js';
import type { BuildInternals } from './internal.js';

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

/**
 * Minimal chunk data extracted from RolldownOutput for deferred manifest/content injection.
 * Allows releasing full RolldownOutput objects early to reduce memory usage.
 */
export interface ExtractedChunk {
	fileName: string;
	code: string;
	moduleIds: string[];
	prerender: boolean;
}

/** Edits server chunks after the server and prerender builds, before they are written again. */
export type BuildPostHook = (params: {
	chunks: ExtractedChunk[];
	mutate: (fileName: string, code: string, prerender: boolean) => void;
}) => void | Promise<void>;

/** The response headers of the prerendered paths, for deploy targets that serve them statically. */
export type RouteToHeaders = Map<string, { headers: Headers; route: RouteData }>;

/** The deploy target's facts the build reads (an `astro` adapter in the CLI). */
export interface BuildAdapter {
	name: string;
	client?: {
		/** Query string appended to the URLs of built assets. */
		assetQueryParams?: URLSearchParams;
	};
	adapterFeatures?: {
		/** Collect the response headers of prerendered pages (see `BuildHost.onGenerated`). */
		staticHeaders?: boolean;
		/** Keep the client directory layout in static builds. */
		preserveBuildClientDir?: boolean;
		/** Keep the server directory layout in static builds. */
		preserveBuildServerDir?: boolean;
	};
}

/** Manifest fields of the built server manifest that the build host computes. */
export type BuildManifestHostFields = Pick<
	SerializedSSRManifest,
	| 'middlewareMode'
	| 'clientDirectives'
	| 'userAssetsBase'
	| 'csp'
	| 'internalFetchHeaders'
	| 'logLevel'
	| 'shouldInjectCspMetaTags'
>;

/** Loads the incremental build cache, or returns `null` when incremental builds are off. */
export type LoadIncrementalCache = (
	internals: BuildInternals,
	options: StaticBuildOptions,
) => Promise<import('./incremental.js').IncrementalBuildCache | null>;

/**
 * What the code that starts a build (the `astro` CLI, or `router()` in a plain Vite build)
 * contributes to it besides the project configuration.
 */
export interface BuildHost {
	adapter: BuildAdapter | undefined;
	/** Renderers whose client entrypoints join the client build. */
	renderers: readonly AstroRenderer[];
	/** Renders the static paths instead of the default prerenderer, or wraps it. */
	prerenderer:
		| Prerenderer
		| ((
				defaultPrerenderer: Prerenderer,
				context: { outputDirectories: BuildOutputDirectories },
		  ) => Prerenderer)
		| undefined;
	/**
	 * Entry of the prerender environment, or `undefined` when the host's plugins set the
	 * prerender input themselves.
	 */
	prerenderEntry: string | undefined;
	/**
	 * Virtual module the server build uses as its entry, and its resolved id, when the host
	 * provides the server entry itself.
	 */
	serverEntry: { id: string; resolvedId: string } | undefined;
	/** Contents of inline scripts added to the head of every page. */
	headInlineScripts: readonly string[];
	/** Renders the static paths in worker threads instead of the default prerenderer; `{ workers }` sets their count. */
	parallelPrerender: boolean | { workers?: number };
	/** Whether redirects render the project's `src/pages/3xx.astro`. */
	redirectPage: boolean;
	/** Vite environments added to the build's own. */
	environments: Record<string, vite.EnvironmentOptions>;
	/** What happens when two routes prerender the same path. */
	prerenderConflictBehavior: 'error' | 'warn' | 'ignore';
	/** Records the duration of a build phase. */
	timer: { start(name: string): void; end(name: string): void };
	/** Throws when `route` must not be prerendered. */
	validatePrerenderedRoute(route: RouteData): void;
	/** Plugins added to the build's own. */
	plugins(internals: BuildInternals, options: StaticBuildOptionsInput): vite.Plugin[];
	/** Edits the Vite config of the build before the builder is created. */
	setupViteConfig(config: InlineConfig, pages: Map<string, PageBuildData>): Promise<InlineConfig>;
	/** Post-processing of the server chunks whose code contains `marker`. */
	chunkPostHooks: ReadonlyArray<{
		marker: string;
		run: (params: Parameters<BuildPostHook>[0], internals: BuildInternals) => void | Promise<void>;
	}>;
	/**
	 * Manifest fields the host computes, once the bundles are built. `clientRoot` is the client output
	 * directory and `clientFiles` the paths of the files in it, relative to `clientRoot`.
	 */
	manifestFields(
		internals: BuildInternals,
		clientRoot: URL,
		clientFiles: Set<string>,
	): Promise<BuildManifestHostFields>;
	/** Runs with the server manifest before it is written into the server bundle. */
	onServerManifest(
		manifest: SerializedSSRManifest,
		middlewareEntryPoint: URL | undefined,
	): Promise<void>;
	/** Runs after the static paths were generated into the client output directory `dir`. */
	onGenerated(routeToHeaders: RouteToHeaders, dir: URL): Promise<void>;
	loadIncrementalCache: LoadIncrementalCache;
}

/** Inputs available before Vite resolves its build environments. */
export interface StaticBuildOptionsInput {
	allPages: AllPagesData;
	config: RouterConfig;
	buildOutput: 'static' | 'server';
	host: BuildHost;
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

export type { SinglePageBuiltModule } from '../../../index.js';

export type ViteBuildReturn = Awaited<ReturnType<typeof vite.build>>;
