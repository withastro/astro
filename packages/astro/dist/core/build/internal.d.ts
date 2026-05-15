import type { SSRResult } from '../../types/public/internal.js';
import type { AstroEnvironmentNames } from '../constants.js';
import type { PageBuildData, StylesheetAsset, ViteID } from './types.js';
export interface BuildInternals {
	/**
	 * Each CSS module is named with a chunk id derived from the Astro pages they
	 * are used in by default. It's easy to crawl this relation in the SSR build as
	 * the Astro pages are the entrypoint, but not for the client build as hydratable
	 * components are the entrypoint instead. This map is used as a cache from the SSR
	 * build so the client can pick up the same information and use the same chunk ids.
	 */
	cssModuleToChunkIdMap: Map<string, string>;
	/**
	 * If script is inlined, its id and inlined code is mapped here. The resolved id is
	 * an URL like "/_astro/something.js" but will no longer exist as the content is now
	 * inlined in this map.
	 */
	inlinedScripts: Map<string, string>;
	entrySpecifierToBundleMap: Map<string, string>;
	/**
	 * A map for page-specific information.
	 */
	pagesByKeys: Map<string, PageBuildData>;
	/**
	 * A map for page-specific information by Vite ID (a path-like string)
	 */
	pagesByViteID: Map<ViteID, PageBuildData>;
	/**
	 * A map for page-specific information by a client:only component
	 */
	pagesByClientOnly: Map<string, Set<PageBuildData>>;
	/**
	 * A map for page-specific information by a script in an Astro file
	 */
	pagesByScriptId: Map<string, Set<PageBuildData>>;
	/**
	 * A map for page-specific information by a hydrated component
	 */
	pagesByHydratedComponent: Map<string, Set<PageBuildData>>;
	/**
	 * A map of hydrated components to export names that are discovered during the SSR build.
	 * These will be used as the top-level entrypoints for the client build.
	 *
	 * @example
	 * '/project/Component1.jsx' => ['default']
	 * '/project/Component2.jsx' => ['Counter', 'Timer']
	 * '/project/Component3.jsx' => ['*']
	 */
	discoveredHydratedComponents: Map<string, string[]>;
	/**
	 * A list of client:only components to export names that are discovered during the SSR build.
	 * These will be used as the top-level entrypoints for the client build.
	 *
	 * @example
	 * '/project/Component1.jsx' => ['default']
	 * '/project/Component2.jsx' => ['Counter', 'Timer']
	 * '/project/Component3.jsx' => ['*']
	 */
	discoveredClientOnlyComponents: Map<string, string[]>;
	/**
	 * A list of scripts that are discovered during the SSR build.
	 * These will be used as the top-level entrypoints for the client build.
	 */
	discoveredScripts: Set<string>;
	/**
	 * Map of propagated module ids (usually something like `/Users/...blog.mdx?astroPropagatedAssets`)
	 * to a set of stylesheets that it uses.
	 */
	propagatedStylesMap: Map<string, Set<StylesheetAsset>>;
	staticFiles: Set<string>;
	clientChunksAndAssets: Set<string>;
	clientInput: Set<string>;
	manifestFileName?: string;
	prerenderEntryFileName?: string;
	componentMetadata: SSRResult['componentMetadata'];
	middlewareEntryPoint: URL | undefined;
	loggerEntryPoint: URL | undefined;
	astroActionsEntryPoint: URL | undefined;
	/**
	 * Assets that need to be moved from SSR/prerender directories to the client directory.
	 * Populated during generateBundle by vitePluginSSRAssets.
	 * Map of environment name -> Set of asset filenames.
	 */
	ssrAssetsPerEnvironment: Map<AstroEnvironmentNames, Set<string>>;
	/**
	 * Chunks extracted during build that need post-build injection (manifest, content).
	 * Populated by top-level buildApp, consumed by post plugin.
	 */
	extractedChunks?: Array<{
		fileName: string;
		code: string;
		moduleIds: string[];
		prerender: boolean;
	}>;
}
/**
 * Creates internal maps used to coordinate the CSS and HTML plugins.
 * @returns {BuildInternals}
 */
export declare function createBuildInternals(): BuildInternals;
/**
 * Gets or creates the set of SSR assets for a given environment.
 * Handles type casting from Vite's string environment name to AstroEnvironmentNames.
 */
export declare function getOrCreateSSRAssets(
	internals: BuildInternals,
	envName: string,
): Set<string>;
/**
 * Gets the set of SSR assets for a given environment, or an empty set if none exist.
 */
export declare function getSSRAssets(internals: BuildInternals, envName: string): Set<string>;
export declare function trackPageData(
	internals: BuildInternals,
	_component: string,
	pageData: PageBuildData,
	componentModuleId: string,
	componentURL: URL,
): void;
/**
 * Tracks client-only components to the pages they are associated with.
 */
export declare function trackClientOnlyPageDatas(
	internals: BuildInternals,
	pageData: PageBuildData,
	clientOnlys: string[],
): void;
/**
 * Tracks scripts to the pages they are associated with.
 */
export declare function trackScriptPageDatas(
	internals: BuildInternals,
	pageData: PageBuildData,
	scriptIds: string[],
): void;
/**
 * Tracks hydrated components to the pages they are associated with.
 */
export declare function trackHydratedComponentPageDatas(
	internals: BuildInternals,
	pageData: PageBuildData,
	hydratedComponents: string[],
): void;
export declare function getPageDatasByClientOnlyID(
	internals: BuildInternals,
	viteid: ViteID,
): Generator<PageBuildData, void, unknown>;
export declare function getPageDataByViteID(
	internals: BuildInternals,
	viteid: ViteID,
): PageBuildData | undefined;
export declare function hasPrerenderedPages(internals: BuildInternals): boolean;
