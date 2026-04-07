import type { SSRResult } from '../../types/public/internal.js';
import type { AstroEnvironmentNames } from '../constants.js';
import { prependForwardSlash, removeFileExtension } from '../path.js';
import { viteID } from '../util.js';
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

	// A mapping of specifiers like astro/client/idle.js to the hashed bundled name.
	// Used to render pages with the correct specifiers.
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
	 * A map for page-specific information by any module that participates in the SSR/prerender graph.
	 */
	pagesByModuleId: Map<string, Set<PageBuildData>>;

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
	 * Per-page dependency metadata captured during the build.
	 */
	pageDependencies: Map<string, PageBuildDependencies>;

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

	// A list of all static files created during the build. Used for SSR.
	staticFiles: Set<string>;

	// A list of all static chunks and assets that are built in the client
	clientChunksAndAssets: Set<string>;

	// All of the input modules for the client.
	clientInput: Set<string>;

	manifestFileName?: string;
	prerenderEntryFileName?: string;
	componentMetadata: SSRResult['componentMetadata'];
	middlewareEntryPoint: URL | undefined;
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

export interface PageBuildDependencies {
	modules: Set<string>;
	hydratedComponents: Set<string>;
	clientOnlyComponents: Set<string>;
	scripts: Set<string>;
	generatedPaths: Map<string, string | null>;
}

/**
 * Creates internal maps used to coordinate the CSS and HTML plugins.
 * @returns {BuildInternals}
 */
export function createBuildInternals(): BuildInternals {
	return {
		clientInput: new Set(),
		cssModuleToChunkIdMap: new Map(),
		inlinedScripts: new Map(),
		entrySpecifierToBundleMap: new Map<string, string>(),
		pagesByKeys: new Map(),
		pagesByViteID: new Map(),
		pagesByModuleId: new Map(),
		pagesByClientOnly: new Map(),
		pagesByScriptId: new Map(),
		pagesByHydratedComponent: new Map(),
		pageDependencies: new Map(),
		propagatedStylesMap: new Map(),
		discoveredHydratedComponents: new Map(),
		discoveredClientOnlyComponents: new Map(),
		discoveredScripts: new Set(),
		staticFiles: new Set(),
		componentMetadata: new Map(),
		astroActionsEntryPoint: undefined,
		middlewareEntryPoint: undefined,
		clientChunksAndAssets: new Set(),
		ssrAssetsPerEnvironment: new Map(),
	};
}

/**
 * Gets or creates the set of SSR assets for a given environment.
 * Handles type casting from Vite's string environment name to AstroEnvironmentNames.
 */
export function getOrCreateSSRAssets(internals: BuildInternals, envName: string): Set<string> {
	const key = envName as AstroEnvironmentNames;
	let assets = internals.ssrAssetsPerEnvironment.get(key);
	if (!assets) {
		assets = new Set();
		internals.ssrAssetsPerEnvironment.set(key, assets);
	}
	return assets;
}

/**
 * Gets the set of SSR assets for a given environment, or an empty set if none exist.
 */
export function getSSRAssets(internals: BuildInternals, envName: string): Set<string> {
	return internals.ssrAssetsPerEnvironment.get(envName as AstroEnvironmentNames) ?? new Set();
}

export function trackPageData(
	internals: BuildInternals,
	_component: string,
	pageData: PageBuildData,
	componentModuleId: string,
	componentURL: URL,
): void {
	pageData.moduleSpecifier = componentModuleId;
	internals.pagesByKeys.set(pageData.key, pageData);
	internals.pagesByViteID.set(viteID(componentURL), pageData);
	getOrCreatePageBuildDependencies(internals, pageData);
}

export function trackModulePageDatas(
	internals: BuildInternals,
	pageData: PageBuildData,
	moduleIds: string[],
) {
	const pageDependencies = getOrCreatePageBuildDependencies(internals, pageData);
	for (const moduleId of moduleIds) {
		let pageDataSet: Set<PageBuildData>;
		if (internals.pagesByModuleId.has(moduleId)) {
			pageDataSet = internals.pagesByModuleId.get(moduleId)!;
		} else {
			pageDataSet = new Set<PageBuildData>();
			internals.pagesByModuleId.set(moduleId, pageDataSet);
		}
		pageDataSet.add(pageData);
		pageDependencies.modules.add(moduleId);
	}
}

/**
 * Tracks client-only components to the pages they are associated with.
 */
export function trackClientOnlyPageDatas(
	internals: BuildInternals,
	pageData: PageBuildData,
	clientOnlys: string[],
) {
	const pageDependencies = getOrCreatePageBuildDependencies(internals, pageData);
	for (const clientOnlyComponent of clientOnlys) {
		let pageDataSet: Set<PageBuildData>;
		// clientOnlyComponent will be similar to `/@fs{moduleID}`
		if (internals.pagesByClientOnly.has(clientOnlyComponent)) {
			pageDataSet = internals.pagesByClientOnly.get(clientOnlyComponent)!;
		} else {
			pageDataSet = new Set<PageBuildData>();
			internals.pagesByClientOnly.set(clientOnlyComponent, pageDataSet);
		}
		pageDataSet.add(pageData);
		pageDependencies.clientOnlyComponents.add(clientOnlyComponent);
	}
}

/**
 * Tracks scripts to the pages they are associated with.
 */
export function trackScriptPageDatas(
	internals: BuildInternals,
	pageData: PageBuildData,
	scriptIds: string[],
) {
	const pageDependencies = getOrCreatePageBuildDependencies(internals, pageData);
	for (const scriptId of scriptIds) {
		let pageDataSet: Set<PageBuildData>;
		if (internals.pagesByScriptId.has(scriptId)) {
			pageDataSet = internals.pagesByScriptId.get(scriptId)!;
		} else {
			pageDataSet = new Set<PageBuildData>();
			internals.pagesByScriptId.set(scriptId, pageDataSet);
		}
		pageDataSet.add(pageData);
		pageDependencies.scripts.add(scriptId);
	}
}

/**
 * Tracks hydrated components to the pages they are associated with.
 */
export function trackHydratedComponentPageDatas(
	internals: BuildInternals,
	pageData: PageBuildData,
	hydratedComponents: string[],
) {
	const pageDependencies = getOrCreatePageBuildDependencies(internals, pageData);
	for (const hydratedComponent of hydratedComponents) {
		let pageDataSet: Set<PageBuildData>;
		if (internals.pagesByHydratedComponent.has(hydratedComponent)) {
			pageDataSet = internals.pagesByHydratedComponent.get(hydratedComponent)!;
		} else {
			pageDataSet = new Set<PageBuildData>();
			internals.pagesByHydratedComponent.set(hydratedComponent, pageDataSet);
		}
		pageDataSet.add(pageData);
		pageDependencies.hydratedComponents.add(hydratedComponent);
	}
}

export function recordGeneratedPagePath(
	internals: BuildInternals,
	pageKey: string,
	pathname: string,
	output: string | null,
) {
	const pageDependencies = internals.pageDependencies.get(pageKey);
	if (!pageDependencies) {
		return;
	}
	pageDependencies.generatedPaths.set(pathname, output);
}

export function* getPageDatasByClientOnlyID(
	internals: BuildInternals,
	viteid: ViteID,
): Generator<PageBuildData, void, unknown> {
	const pagesByClientOnly = internals.pagesByClientOnly;
	if (pagesByClientOnly.size) {
		// 1. Try the viteid
		let pageBuildDatas = pagesByClientOnly.get(viteid);

		// 2. Try prepending /@fs
		if (!pageBuildDatas) {
			let pathname = `/@fs${prependForwardSlash(viteid)}`;
			pageBuildDatas = pagesByClientOnly.get(pathname);
		}

		// 3. Remove the file extension
		// BUG! The compiler partially resolves .jsx to remove the file extension so we have to check again.
		// We should probably get rid of all `@fs` usage and always fully resolve via Vite,
		// but this would be a bigger change.
		if (!pageBuildDatas) {
			let pathname = `/@fs${prependForwardSlash(removeFileExtension(viteid))}`;
			pageBuildDatas = pagesByClientOnly.get(pathname);
		}
		if (pageBuildDatas) {
			for (const pageData of pageBuildDatas) {
				yield pageData;
			}
		}
	}
}

export function getPageDataByViteID(
	internals: BuildInternals,
	viteid: ViteID,
): PageBuildData | undefined {
	if (internals.pagesByViteID.has(viteid)) {
		return internals.pagesByViteID.get(viteid);
	}
	return undefined;
}

export function hasPrerenderedPages(internals: BuildInternals) {
	for (const pageData of internals.pagesByKeys.values()) {
		if (pageData.route.prerender) {
			return true;
		}
	}
	return false;
}

function getOrCreatePageBuildDependencies(
	internals: BuildInternals,
	pageData: PageBuildData,
): PageBuildDependencies {
	let pageDependencies = internals.pageDependencies.get(pageData.key);
	if (!pageDependencies) {
		pageDependencies = {
			modules: new Set<string>(),
			hydratedComponents: new Set<string>(),
			clientOnlyComponents: new Set<string>(),
			scripts: new Set<string>(),
			generatedPaths: new Map<string, string | null>(),
		};
		internals.pageDependencies.set(pageData.key, pageDependencies);
	}
	return pageDependencies;
}
