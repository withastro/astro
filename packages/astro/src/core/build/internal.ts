import type { OutputChunk, RenderedChunk } from 'rollup';
import type { PageBuildData, ViteID } from './types';

import { prependForwardSlash } from '../path.js';
import { viteID } from '../util.js';

export interface BuildInternals {
	// Pure CSS chunks are chunks that only contain CSS.
	pureCSSChunks: Set<RenderedChunk>;

	// A mapping of hoisted script ids back to the exact hoisted scripts it references
	hoistedScriptIdToHoistedMap: Map<string, Set<string>>;
	// A mapping of hoisted script ids back to the pages which reference it
	hoistedScriptIdToPagesMap: Map<string, Set<string>>;

	// A mapping of specifiers like astro/client/idle.js to the hashed bundled name.
	// Used to render pages with the correct specifiers.
	entrySpecifierToBundleMap: Map<string, string>;

	/**
	 * A map for page-specific information.
	 */
	pagesByComponent: Map<string, PageBuildData>;

	/**
	 * A map for page-specific information by Vite ID (a path-like string)
	 */
	pagesByViteID: Map<ViteID, PageBuildData>;

	/**
	 * A map for page-specific information by a client:only component
	 */
	pagesByClientOnly: Map<string, Set<PageBuildData>>;

	/**
	 * A list of hydrated components that are discovered during the SSR build
	 * These will be used as the top-level entrypoints for the client build.
	 */
	discoveredHydratedComponents: Set<string>;
	/**
	 * A list of client:only components that are discovered during the SSR build
	 * These will be used as the top-level entrypoints for the client build.
	 */
	discoveredClientOnlyComponents: Set<string>;
	/**
	 * A list of hoisted scripts that are discovered during the SSR build
	 * These will be used as the top-level entrypoints for the client build.
	 */
	discoveredScripts: Set<string>;

	// A list of all static files created during the build. Used for SSR.
	staticFiles: Set<string>;
	// The SSR entry chunk. Kept in internals to share between ssr/client build steps
	ssrEntryChunk?: OutputChunk;
}

/**
 * Creates internal maps used to coordinate the CSS and HTML plugins.
 * @returns {BuildInternals}
 */
export function createBuildInternals(): BuildInternals {
	// Pure CSS chunks are chunks that only contain CSS.
	// This is all of them, and chunkToReferenceIdMap maps them to a hash id used to find the final file.
	const pureCSSChunks = new Set<RenderedChunk>();
	const chunkToReferenceIdMap = new Map<string, string>();

	// This is a mapping of pathname to the string source of all collected
	// inline <style> for a page.
	const astroStyleMap = new Map<string, string>();
	// This is a virtual JS module that imports all dependent styles for a page.
	const astroPageStyleMap = new Map<string, string>();

	// These are for tracking hoisted script bundling
	const hoistedScriptIdToHoistedMap = new Map<string, Set<string>>();

	// This tracks hoistedScriptId => page components
	const hoistedScriptIdToPagesMap = new Map<string, Set<string>>();

	return {
		pureCSSChunks,
		hoistedScriptIdToHoistedMap,
		hoistedScriptIdToPagesMap,
		entrySpecifierToBundleMap: new Map<string, string>(),

		pagesByComponent: new Map(),
		pagesByViteID: new Map(),
		pagesByClientOnly: new Map(),

		discoveredHydratedComponents: new Set(),
		discoveredClientOnlyComponents: new Set(),
		discoveredScripts: new Set(),
		staticFiles: new Set(),
	};
}

export function trackPageData(
	internals: BuildInternals,
	component: string,
	pageData: PageBuildData,
	componentModuleId: string,
	componentURL: URL
): void {
	pageData.moduleSpecifier = componentModuleId;
	internals.pagesByComponent.set(component, pageData);
	internals.pagesByViteID.set(viteID(componentURL), pageData);
}

/**
 * Tracks client-only components to the pages they are associated with.
 */
export function trackClientOnlyPageDatas(
	internals: BuildInternals,
	pageData: PageBuildData,
	clientOnlys: string[]
) {
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
	}
}

export function* getPageDatasByChunk(
	internals: BuildInternals,
	chunk: RenderedChunk
): Generator<PageBuildData, void, unknown> {
	const pagesByViteID = internals.pagesByViteID;
	for (const [modulePath] of Object.entries(chunk.modules)) {
		if (pagesByViteID.has(modulePath)) {
			yield pagesByViteID.get(modulePath)!;
		}
	}
}

export function* getPageDatasByClientOnlyID(
	internals: BuildInternals,
	viteid: ViteID
): Generator<PageBuildData, void, unknown> {
	const pagesByClientOnly = internals.pagesByClientOnly;
	if (pagesByClientOnly.size) {
		const pathname = `/@fs${prependForwardSlash(viteid)}`;
		const pageBuildDatas = pagesByClientOnly.get(pathname);
		if (pageBuildDatas) {
			for (const pageData of pageBuildDatas) {
				yield pageData;
			}
		}
	}
}

export function getPageDataByComponent(
	internals: BuildInternals,
	component: string
): PageBuildData | undefined {
	if (internals.pagesByComponent.has(component)) {
		return internals.pagesByComponent.get(component);
	}
	return undefined;
}

export function getPageDataByViteID(
	internals: BuildInternals,
	viteid: ViteID
): PageBuildData | undefined {
	if (internals.pagesByViteID.has(viteid)) {
		return internals.pagesByViteID.get(viteid);
	}
	return undefined;
}

export function hasPageDataByViteID(internals: BuildInternals, viteid: ViteID): boolean {
	return internals.pagesByViteID.has(viteid);
}

export function* eachPageData(internals: BuildInternals) {
	yield* internals.pagesByComponent.values();
}
