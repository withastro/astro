import type { Rollup } from 'vite';
import type { RouteData, SSRResult } from '../../@types/astro';
import type { PageOptions } from '../../vite-plugin-astro/types';
import { prependForwardSlash, removeFileExtension } from '../path.js';
import { viteID } from '../util.js';
import {
	ASTRO_PAGE_RESOLVED_MODULE_ID,
	getVirtualModulePageIdFromPath,
} from './plugins/plugin-pages.js';
import { RESOLVED_SPLIT_MODULE_ID } from './plugins/plugin-ssr.js';
import { ASTRO_PAGE_EXTENSION_POST_PATTERN } from './plugins/util.js';
import type { PageBuildData, StylesheetAsset, ViteID } from './types';

export interface BuildInternals {
	/**
	 * Each CSS module is named with a chunk id derived from the Astro pages they
	 * are used in by default. It's easy to crawl this relation in the SSR build as
	 * the Astro pages are the entrypoint, but not for the client build as hydratable
	 * components are the entrypoint instead. This map is used as a cache from the SSR
	 * build so the client can pick up the same information and use the same chunk ids.
	 */
	cssModuleToChunkIdMap: Map<string, string>;

	// A mapping of hoisted script ids back to the exact hoisted scripts it references
	hoistedScriptIdToHoistedMap: Map<string, Set<string>>;
	// A mapping of hoisted script ids back to the pages which reference it
	hoistedScriptIdToPagesMap: Map<string, Set<string>>;

	// A mapping of specifiers like astro/client/idle.js to the hashed bundled name.
	// Used to render pages with the correct specifiers.
	entrySpecifierToBundleMap: Map<string, string>;

	/**
	 * A map to get a specific page's bundled output file.
	 */
	pageToBundleMap: Map<string, string>;

	/**
	 * A map for page-specific information.
	 */
	pagesByComponent: Map<string, PageBuildData>;

	/**
	 * A map for page-specific output.
	 */
	pageOptionsByPage: Map<string, PageOptions>;

	/**
	 * A map for page-specific information by Vite ID (a path-like string)
	 */
	pagesByViteID: Map<ViteID, PageBuildData>;

	/**
	 * A map for page-specific information by a client:only component
	 */
	pagesByClientOnly: Map<string, Set<PageBuildData>>;

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
	 * A list of hoisted scripts that are discovered during the SSR build
	 * These will be used as the top-level entrypoints for the client build.
	 */
	discoveredScripts: Set<string>;

	// A list of all static files created during the build. Used for SSR.
	staticFiles: Set<string>;
	// The SSR entry chunk. Kept in internals to share between ssr/client build steps
	ssrEntryChunk?: Rollup.OutputChunk;
	entryPoints: Map<RouteData, URL>;
	ssrSplitEntryChunks: Map<string, Rollup.OutputChunk>;
	componentMetadata: SSRResult['componentMetadata'];
}

/**
 * Creates internal maps used to coordinate the CSS and HTML plugins.
 * @returns {BuildInternals}
 */
export function createBuildInternals(): BuildInternals {
	// These are for tracking hoisted script bundling
	const hoistedScriptIdToHoistedMap = new Map<string, Set<string>>();

	// This tracks hoistedScriptId => page components
	const hoistedScriptIdToPagesMap = new Map<string, Set<string>>();

	return {
		cssModuleToChunkIdMap: new Map(),
		hoistedScriptIdToHoistedMap,
		hoistedScriptIdToPagesMap,
		entrySpecifierToBundleMap: new Map<string, string>(),
		pageToBundleMap: new Map<string, string>(),
		pagesByComponent: new Map(),
		pageOptionsByPage: new Map(),
		pagesByViteID: new Map(),
		pagesByClientOnly: new Map(),

		discoveredHydratedComponents: new Map(),
		discoveredClientOnlyComponents: new Map(),
		discoveredScripts: new Set(),
		staticFiles: new Set(),
		componentMetadata: new Map(),
		ssrSplitEntryChunks: new Map(),
		entryPoints: new Map(),
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
	chunk: Rollup.RenderedChunk
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

export function* eachRedirectPageData(internals: BuildInternals) {
	for (const pageData of eachPageData(internals)) {
		if (pageData.route.type === 'redirect') {
			yield pageData;
		}
	}
}

export function* eachPageDataFromEntryPoint(
	internals: BuildInternals
): Generator<[PageBuildData, string]> {
	for (const [entryPoint, filePath] of internals.entrySpecifierToBundleMap) {
		// virtual pages can be emitted with different prefixes:
		// - the classic way are pages emitted with prefix ASTRO_PAGE_RESOLVED_MODULE_ID -> plugin-pages
		// - pages emitted using `build.split`, in this case pages are emitted with prefix RESOLVED_SPLIT_MODULE_ID
		if (
			entryPoint.includes(ASTRO_PAGE_RESOLVED_MODULE_ID) ||
			entryPoint.includes(RESOLVED_SPLIT_MODULE_ID)
		) {
			const [, pageName] = entryPoint.split(':');
			const pageData = internals.pagesByComponent.get(
				`${pageName.replace(ASTRO_PAGE_EXTENSION_POST_PATTERN, '.')}`
			);
			if (!pageData) {
				throw new Error(
					"Build failed. Astro couldn't find the emitted page from " + pageName + ' pattern'
				);
			}

			yield [pageData, filePath];
		}
	}
}

export function hasPrerenderedPages(internals: BuildInternals) {
	for (const pageData of eachPageData(internals)) {
		if (pageData.route.prerender) {
			return true;
		}
	}
	return false;
}

interface OrderInfo {
	depth: number;
	order: number;
}

/**
 * Sort a page's CSS by depth. A higher depth means that the CSS comes from shared subcomponents.
 * A lower depth means it comes directly from the top-level page.
 * Can be used to sort stylesheets so that shared rules come first
 * and page-specific rules come after.
 */
export function cssOrder(a: OrderInfo, b: OrderInfo) {
	let depthA = a.depth,
		depthB = b.depth,
		orderA = a.order,
		orderB = b.order;

	if (orderA === -1 && orderB >= 0) {
		return 1;
	} else if (orderB === -1 && orderA >= 0) {
		return -1;
	} else if (orderA > orderB) {
		return 1;
	} else if (orderA < orderB) {
		return -1;
	} else {
		if (depthA === -1) {
			return -1;
		} else if (depthB === -1) {
			return 1;
		} else {
			return depthA > depthB ? -1 : 1;
		}
	}
}

export function mergeInlineCss(
	acc: Array<StylesheetAsset>,
	current: StylesheetAsset
): Array<StylesheetAsset> {
	const lastAdded = acc.at(acc.length - 1);
	const lastWasInline = lastAdded?.type === 'inline';
	const currentIsInline = current?.type === 'inline';
	if (lastWasInline && currentIsInline) {
		const merged = { type: 'inline' as const, content: lastAdded.content + current.content };
		acc[acc.length - 1] = merged;
		return acc;
	}
	acc.push(current);
	return acc;
}

export function isHoistedScript(internals: BuildInternals, id: string): boolean {
	return internals.hoistedScriptIdToPagesMap.has(id);
}

export function* getPageDatasByHoistedScriptId(
	internals: BuildInternals,
	id: string
): Generator<PageBuildData, void, unknown> {
	const set = internals.hoistedScriptIdToPagesMap.get(id);
	if (set) {
		for (const pageId of set) {
			const pageData = getPageDataByComponent(internals, pageId.slice(1));
			if (pageData) {
				yield pageData;
			}
		}
	}
}

// From a component path such as pages/index.astro find the entrypoint module
export function getEntryFilePathFromComponentPath(internals: BuildInternals, path: string) {
	const id = getVirtualModulePageIdFromPath(path);
	return internals.entrySpecifierToBundleMap.get(id);
}
