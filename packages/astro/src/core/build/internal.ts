import type { RouteData } from '../../@types/astro';
import type { RenderedChunk } from 'rollup';
import type { PageBuildData, ViteID } from './types';

import { viteID } from '../util.js';

export interface BuildInternals {
	// Pure CSS chunks are chunks that only contain CSS.
	pureCSSChunks: Set<RenderedChunk>;

	// TODO document what this is
	hoistedScriptIdToHoistedMap: Map<string, Set<string>>;

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
	 * chunkToReferenceIdMap maps them to a hash id used to find the final file.
	 * @deprecated This Map is only used for the legacy build.
	 */
	chunkToReferenceIdMap: Map<string, string>;

	/**
	 * This is a mapping of pathname to the string source of all collected inline <style> for a page.
	 * @deprecated This Map is only used for the legacy build.
	 */
	astroStyleMap: Map<string, string>;

	/**
	 * This is a virtual JS module that imports all dependent styles for a page.
	 * @deprecated This Map is only used for the legacy build.
	 */
	astroPageStyleMap: Map<string, string>;
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

	return {
		pureCSSChunks,
		chunkToReferenceIdMap,
		astroStyleMap,
		astroPageStyleMap,
		hoistedScriptIdToHoistedMap,
		entrySpecifierToBundleMap: new Map<string, string>(),

		pagesByComponent: new Map(),
		pagesByViteID: new Map(),
	};
}

export function trackPageData(internals: BuildInternals, component: string, pageData: PageBuildData, componentModuleId: string, componentURL: URL): void {
	pageData.moduleSpecifier = componentModuleId;
	internals.pagesByComponent.set(component, pageData);
	internals.pagesByViteID.set(viteID(componentURL), pageData);
}

export function* getPageDatasByChunk(internals: BuildInternals, chunk: RenderedChunk): Generator<PageBuildData, void, unknown> {
	const pagesByViteID = internals.pagesByViteID;
	for (const [modulePath] of Object.entries(chunk.modules)) {
		if (pagesByViteID.has(modulePath)) {
			yield pagesByViteID.get(modulePath)!;
		}
	}
}

export function getPageDataByComponent(internals: BuildInternals, component: string): PageBuildData | undefined {
	if (internals.pagesByComponent.has(component)) {
		return internals.pagesByComponent.get(component);
	}
	return undefined;
}

export function getPageDataByViteID(internals: BuildInternals, viteid: ViteID): PageBuildData | undefined {
	if (internals.pagesByViteID.has(viteid)) {
		return internals.pagesByViteID.get(viteid);
	}
	return undefined;
}

export function* eachPageData(internals: BuildInternals) {
	yield* internals.pagesByComponent.values();
}
