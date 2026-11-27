import type { BuildOptions, ResolvedConfig, Plugin as VitePlugin, Rolldown } from 'vite';
import { isCSSRequest } from 'vite';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../constants.js';
import { isPropagatedAssetBoundary } from '@astrojs/runtime/_internal/core/head-propagation/boundary.js';
import { VIRTUAL_PAGE_RESOLVED_MODULE_ID } from '../../../vite-plugin-pages/const.js';
import { getParentExtendedModuleInfos, moduleIsTopLevelPage } from '../graph.js';
import type { BuildInternals } from '../internal.js';
import { getPageDataByViteID, getPageDatasByClientOnlyID } from '../internal.js';
import type { PageBuildData, StaticBuildOptionsInput, StylesheetAsset } from '../types.js';
import { normalizeEntryId } from './plugin-component-entry.js';
import { shouldInlineAsset } from './util.js';

/***** ASTRO PLUGIN *****/

export function pluginCSS(
	options: StaticBuildOptionsInput,
	internals: BuildInternals,
): VitePlugin[] {
	return rollupPluginAstroBuildCSS({
		buildOptions: options,
		internals,
	});
}

/***** ROLLUP SUB-PLUGINS *****/

interface PluginOptions {
	internals: BuildInternals;
	buildOptions: StaticBuildOptionsInput;
}

function isBuildCssBoundary(id: string, ctx: { getModuleInfo: Rolldown.GetModuleInfo }): boolean {
	if (isPropagatedAssetBoundary(id)) return true;
	const info = ctx.getModuleInfo(id);
	if (!info || !moduleIsTopLevelPage(info)) return false;
	const allImporters = info.importers.concat(info.dynamicImporters);
	const hasNonVirtualPageImporter = allImporters.some(
		(importer) => !importer.includes(VIRTUAL_PAGE_RESOLVED_MODULE_ID),
	);
	// Pages imported by non-virtual modules (e.g. partials imported by other pages)
	// should propagate CSS transitively instead of acting as hard page boundaries.
	return !hasNonVirtualPageImporter;
}

function rollupPluginAstroBuildCSS(options: PluginOptions): VitePlugin[] {
	const { internals, buildOptions } = options;
	const { settings } = buildOptions;

	let resolvedConfig: ResolvedConfig;

	// stylesheet filenames are kept in here until "post", when they are rendered and ready to be inlined
	const pagesToCss: Record<string, Record<string, { order: number; depth: number }>> = {};
	// Map of module Ids (usually something like `/Users/...blog.mdx?astroPropagatedAssets`) to its imported CSS
	const moduleIdToPropagatedCss: Record<string, Set<string>> = {};
	// Map of page module specifiers to the CSS module IDs assigned to them by the SSR/prerender builds
	const pageToSsrCssModules: Record<string, Set<string>> = {};
	// CSS module IDs that the SSR/prerender builds assigned to propagated assets (e.g. content
	// entries), which add them to whichever page renders them
	const propagatedSsrCssModules = new Set<string>();

	/**
	 * Whether the SSR/prerender build already put every one of `cssModuleIds` on the page,
	 * excluding CSS that Vite tree-shook because the component it is scoped to (`cssScopeTo`)
	 * was never rendered on the server (https://github.com/withastro/astro/issues/16251).
	 */
	function hasServerRenderedCss(
		pageData: PageBuildData,
		cssModuleIds: string[],
		ctx: { getModuleInfo: Rolldown.GetModuleInfo },
	): boolean {
		const pageCssModules = pageToSsrCssModules[pageData.moduleSpecifier];
		return cssModuleIds.every((id) => {
			if (!pageCssModules?.has(id) && !propagatedSsrCssModules.has(id)) return false;
			const cssScopeTo = ctx.getModuleInfo(id)?.meta?.vite?.cssScopeTo as
				| [string, string]
				| undefined;
			return !cssScopeTo || !!internals.ssrRenderedExports?.get(cssScopeTo[0])?.has(cssScopeTo[1]);
		});
	}

	const cssBuildPlugin: VitePlugin = {
		name: 'astro:rollup-plugin-build-css',

		applyToEnvironment(environment) {
			return (
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.client ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
			);
		},

		async generateBundle(_outputOptions, bundle) {
			if (
				this.environment?.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				this.environment?.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
			) {
				for (const [, chunk] of Object.entries(bundle)) {
					if (chunk.type !== 'chunk') continue;

					// Deduplicate CSS assets between the prerender and SSR environments.
					// Both environments bundle shared layouts separately, which emits one CSS
					// asset per environment for the same CSS source modules (e.g. `index.X.css`
					// and `_..Y.css`). The prerender build runs first and records its CSS asset
					// filenames keyed by the chunk's CSS module set; the SSR build then renames
					// its matching assets to the prerender filenames, so both end up as a single
					// file once assets are moved to the client directory.
					// Keyed by module identity rather than content hash because plugins that
					// scan the environment's module graph (e.g. Tailwind) can produce slightly
					// different content for the same CSS source in each environment.
					const cssModuleIds = Object.keys(chunk.modules || {}).filter(isCSSRequest);
					const importedCss = (chunk.viteMetadata as ViteMetadata | undefined)?.importedCss;
					if (cssModuleIds.length > 0 && importedCss?.size === 1) {
						const moduleKey = cssModuleIds.sort().join('\n');
						const [assetFileName] = importedCss;
						if (this.environment?.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender) {
							internals.prerenderCssAssetByModuleKey.set(moduleKey, assetFileName);
						} else {
							const prerenderFileName = internals.prerenderCssAssetByModuleKey.get(moduleKey);
							if (prerenderFileName && prerenderFileName !== assetFileName) {
								renameBundleAsset(bundle, assetFileName, prerenderFileName);
							}
						}
					}

					// Track which component exports were rendered during SSR.
					// This is used by the client build to determine if cssScopeTo CSS
					// was tree-shaken (component not rendered in SSR) vs included.
					for (const [moduleId, moduleInfo] of Object.entries(chunk.modules || {})) {
						if (moduleInfo.renderedExports.length > 0) {
							const existing = internals.ssrRenderedExports?.get(moduleId);
							if (existing) {
								for (const exp of moduleInfo.renderedExports) {
									existing.add(exp);
								}
							} else {
								internals.ssrRenderedExports ??= new Map();
								internals.ssrRenderedExports.set(moduleId, new Set(moduleInfo.renderedExports));
							}
						}
					}
				}
			}

			// A page loads a client chunk through the hydrated components, `client:only` components
			// and scripts it renders, statically or through `import()`. The chunk's CSS is added to
			// each of those pages unless the page's server build already includes all of it.
			// Styles of dynamically imported modules go in the HTML rather than being left to Vite's
			// preload, because the preload list is shared by every page: it cannot skip a file only on
			// the pages that already have its styles. https://github.com/withastro/astro/issues/18767
			if (this.environment?.name === ASTRO_VITE_ENVIRONMENT_NAMES.client) {
				// Client CSS assets that at least one page links or inlines
				const cssOnPages = new Set<string>();
				// Client CSS assets that an entry not attributed to any page can load, e.g. a
				// script added with `injectScript('page')`. Only Vite's preload delivers them.
				// https://github.com/withastro/astro/issues/18137
				const cssForUnattributedEntries = new Set<string>();

				for (const chunk of Object.values(bundle)) {
					if (chunk.type !== 'chunk') continue;
					const meta = chunk.viteMetadata as ViteMetadata;
					if (meta.importedCss.size < 1) continue;

					const cssModuleIds = Object.keys(chunk.modules).filter((id) => isCSSRequest(id));
					let loadedByUnattributedEntry = cssModuleIds.length === 0;
					// Walk up from CSS modules only. Rolldown can merge unrelated modules into the
					// chunk, and walking from those would attribute its CSS to pages that never
					// load it. https://github.com/withastro/astro/issues/17043
					for (const id of cssModuleIds) {
						for (const { info, order } of getParentExtendedModuleInfos(id, this)) {
							const entryPages = getPagesByClientEntry(info.id, order, internals);
							if (
								entryPages.length === 0 &&
								info.importers.length === 0 &&
								info.dynamicImporters.length === 0
							) {
								loadedByUnattributedEntry = true;
							}
							for (const { pageData, order: cssOrder } of entryPages) {
								if (hasServerRenderedCss(pageData, cssModuleIds, this)) continue;
								appendCSSToPage(pageData, meta, pagesToCss, -1, cssOrder, this.environment.name);
								for (const cssId of meta.importedCss) cssOnPages.add(cssId);
							}
						}
					}
					if (loadedByUnattributedEntry) {
						for (const cssId of meta.importedCss) cssForUnattributedEntries.add(cssId);
					}
				}

				// Every page that can load a client chunk, statically or through `import()`, now
				// has the chunk's styles in its HTML, from the server build or from `pagesToCss`.
				// Remove them from `importedCss`, which Vite turns into the preload list of dynamic
				// imports, so the browser doesn't load them again under another URL
				// (https://github.com/withastro/astro/issues/18677), and delete the files no page
				// links. A deleted file left in `importedCss` would 404 when preloaded
				// (https://github.com/withastro/astro/issues/18191).
				for (const chunk of Object.values(bundle)) {
					if (chunk.type !== 'chunk') continue;
					const importedCss = (chunk.viteMetadata as ViteMetadata).importedCss;
					for (const cssId of importedCss) {
						if (cssForUnattributedEntries.has(cssId)) continue;
						importedCss.delete(cssId);
						if (!cssOnPages.has(cssId)) delete bundle[cssId];
					}
				}
				return;
			}

			for (const [, chunk] of Object.entries(bundle)) {
				if (chunk.type !== 'chunk') continue;
				if ('viteMetadata' in chunk === false) continue;
				const meta = chunk.viteMetadata as ViteMetadata;

				// Skip if the chunk has no CSS, we want to handle CSS chunks only
				if (meta.importedCss.size < 1) continue;

				// For this CSS chunk, walk parents until you find a page. Add the CSS to that page.
				for (const id of Object.keys(chunk.modules)) {
					// Only walk up for dependencies that are CSS
					if (!isCSSRequest(id)) continue;

					const parentModuleInfos = getParentExtendedModuleInfos(id, this, (importer) =>
						isBuildCssBoundary(importer, this),
					);
					for (const { info: pageInfo, depth, order } of parentModuleInfos) {
						if (isPropagatedAssetBoundary(pageInfo.id)) {
							const propagatedCss = (moduleIdToPropagatedCss[pageInfo.id] ??= new Set());
							for (const css of meta.importedCss) {
								propagatedCss.add(css);
							}
							propagatedSsrCssModules.add(id);
						} else if (moduleIsTopLevelPage(pageInfo)) {
							const pageViteID = pageInfo.id;
							const pageData = getPageDataByViteID(internals, pageViteID);
							if (pageData) {
								appendCSSToPage(pageData, meta, pagesToCss, depth, order, this.environment?.name);
								if (isRenderedByServerEnvironment(pageData, this.environment?.name)) {
									(pageToSsrCssModules[pageData.moduleSpecifier] ??= new Set()).add(id);
								}
							}
						}
					}
				}
			}
		},
	};

	const singleCssPlugin: VitePlugin = {
		name: 'astro:rollup-plugin-single-css',
		enforce: 'post',
		applyToEnvironment(environment) {
			return (
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.client ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
			);
		},
		configResolved(config) {
			resolvedConfig = config;
		},
		generateBundle(_, bundle) {
			// If user disable css code-splitting, search for Vite's hardcoded
			// `style.css` and add it as css for each page.
			// Ref: https://github.com/vitejs/vite/blob/b2c0ee04d4db4a0ef5a084c50f49782c5f88587c/packages/vite/src/node/plugins/html.ts#L690-L705
			if (resolvedConfig.build.cssCodeSplit) return;
			const cssChunk = Object.values(bundle).find(
				(chunk) => chunk.type === 'asset' && chunk.name === 'style.css',
			);
			if (cssChunk === undefined) return;
			for (const pageData of internals.pagesByKeys.values()) {
				const cssToInfoMap = (pagesToCss[pageData.moduleSpecifier] ??= {});
				cssToInfoMap[cssChunk.fileName] = { depth: -1, order: -1 };
			}
		},
	};

	let assetsInlineLimit: NonNullable<BuildOptions['assetsInlineLimit']>;
	const inlineStylesheetsPlugin: VitePlugin = {
		name: 'astro:rollup-plugin-inline-stylesheets',
		enforce: 'post',
		applyToEnvironment(environment) {
			return (
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.client ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
			);
		},
		configResolved(config) {
			assetsInlineLimit = config.build.assetsInlineLimit;
		},
		async generateBundle(_outputOptions, bundle) {
			const inlineConfig = settings.config.build.inlineStylesheets;

			Object.entries(bundle).forEach(([id, stylesheet]) => {
				if (
					stylesheet.type !== 'asset' ||
					stylesheet.name?.endsWith('.css') !== true ||
					typeof stylesheet.source !== 'string'
				)
					return;

				// Delete empty CSS chunks. In prerender these are likely duplicates
				// from SSR.
				if (stylesheet.source.length === 0) {
					delete bundle[id];
					return;
				}

				const toBeInlined =
					inlineConfig === 'always'
						? true
						: inlineConfig === 'never'
							? false
							: shouldInlineAsset(stylesheet.source, stylesheet.fileName, assetsInlineLimit);

				// there should be a single js object for each stylesheet,
				// allowing the single reference to be shared and checked for duplicates
				const sheet: StylesheetAsset = toBeInlined
					? { type: 'inline', content: stylesheet.source }
					: { type: 'external', src: stylesheet.fileName };

				let sheetAddedToPage = false;

				internals.pagesByKeys.forEach((pageData) => {
					const orderingInfo = pagesToCss[pageData.moduleSpecifier]?.[stylesheet.fileName];
					if (orderingInfo !== undefined) {
						// Check if this stylesheet was already added to this page.
						// We check both inline (by content) and external (by src) styles to prevent
						// duplicates that can occur when CSS is imported from both a page's frontmatter
						// and a component's script tag, or when the same plugin runs in both SSR and client builds.
						const alreadyAdded = pageData.styles.some((s) => {
							if (s.sheet.type === 'external' && sheet.type === 'external') {
								return s.sheet.src === sheet.src;
							}
							if (s.sheet.type === 'inline' && sheet.type === 'inline') {
								return s.sheet.content === sheet.content;
							}
							return false;
						});

						if (!alreadyAdded) {
							pageData.styles.push({ ...orderingInfo, sheet });
						}
						sheetAddedToPage = true;
					}
				});

				// Apply `moduleIdToPropagatedCss` information to `internals.propagatedStylesMap`.
				// NOTE: It's pretty much a copy over to `internals.propagatedStylesMap` as it should be
				// completely empty. The whole propagation handling could be better refactored in the future.
				for (const moduleId in moduleIdToPropagatedCss) {
					if (!moduleIdToPropagatedCss[moduleId].has(stylesheet.fileName)) continue;
					let propagatedStyles = internals.propagatedStylesMap.get(moduleId);
					if (!propagatedStyles) {
						propagatedStyles = new Set();
						internals.propagatedStylesMap.set(moduleId, propagatedStyles);
					}
					propagatedStyles.add(sheet);
					sheetAddedToPage = true;
				}

				const wasInlined = toBeInlined && sheetAddedToPage;
				// Stylesheets referenced by a chunk (via importedAssets for ?url imports,
				// or importedCss for normal CSS imports) are delivered by Vite's preload
				// helper at runtime and must not be treated as orphaned.
				const wasAddedToChunk = Object.values(bundle).some(
					(chunk) =>
						chunk.type === 'chunk' &&
						(chunk.viteMetadata?.importedAssets?.has(id) ||
							chunk.viteMetadata?.importedCss?.has(id)),
				);
				const isOrphaned = !sheetAddedToPage && !wasAddedToChunk;

				if (wasInlined || isOrphaned) {
					// wasInlined : CSS is already added to all used pages
					// isOrphaned : CSS is already used in a merged chunk
					// we can delete it from the bundle
					// and make sure no chunks reference it via `importedCss` (for Vite preloading)
					// to avoid duplicate CSS.
					delete bundle[id];
					for (const chunk of Object.values(bundle)) {
						if (chunk.type === 'chunk') {
							chunk.viteMetadata?.importedCss?.delete(id);
						}
					}
				}
			});
		},
	};

	return [cssBuildPlugin, singleCssPlugin, inlineStylesheetsPlugin];
}

/***** UTILITY FUNCTIONS *****/

/**
 * Renames an emitted asset in the bundle and updates every chunk's Vite metadata
 * that references the old filename. Used to give an SSR CSS asset the filename of
 * the equivalent prerender CSS asset so the two builds don't emit duplicate files.
 */
function renameBundleAsset(
	bundle: Rolldown.OutputBundle,
	fromFileName: string,
	toFileName: string,
) {
	const asset = bundle[fromFileName];
	// Never clobber an asset that already exists under the target name in this bundle.
	if (!asset || asset.type !== 'asset' || bundle[toFileName]) return;

	// Mutate `fileName` in place instead of re-keying the bundle object: the bundle
	// is a Rolldown proxy that ignores direct key assignment, and the writer emits
	// files based on `fileName`, not the bundle key.
	asset.fileName = toFileName;

	for (const chunk of Object.values(bundle)) {
		if (chunk.type !== 'chunk') continue;
		const meta = chunk.viteMetadata as ViteMetadata | undefined;
		if (meta?.importedCss?.delete(fromFileName)) {
			meta.importedCss.add(toFileName);
		}
		if (meta?.importedAssets?.delete(fromFileName)) {
			meta.importedAssets.add(toFileName);
		}
	}
}

/**
 * Returns the pages that load the client module `id` as a hydrated component, a `client:only`
 * component, or a `<script>`, with the order to give the module's CSS on each page.
 */
function getPagesByClientEntry(
	id: string,
	order: number,
	internals: BuildInternals,
): Array<{ pageData: PageBuildData; order: number }> {
	const entryId = normalizeEntryId(id);
	const pages: Array<{ pageData: PageBuildData; order: number }> = [];
	for (const pageData of internals.pagesByHydratedComponent.get(entryId) ?? []) {
		pages.push({ pageData, order: -1 });
	}
	for (const pageData of getPageDatasByClientOnlyID(internals, entryId)) {
		pages.push({ pageData, order: -1 });
	}
	for (const pageData of internals.pagesByScriptId.get(entryId) ?? []) {
		pages.push({ pageData, order });
	}
	return pages;
}

type ViteMetadata = {
	importedAssets: Set<string>;
	importedCss: Set<string>;
};

/**
 * Whether the page is rendered by the given server environment: SSR renders on-demand
 * pages and prerender renders prerendered pages. Always false for the client environment.
 */
function isRenderedByServerEnvironment(
	pageData: PageBuildData,
	environmentName: string | undefined,
): boolean {
	if (environmentName === ASTRO_VITE_ENVIRONMENT_NAMES.ssr) return !pageData.route.prerender;
	if (environmentName === ASTRO_VITE_ENVIRONMENT_NAMES.prerender) return pageData.route.prerender;
	return false;
}

function appendCSSToPage(
	pageData: PageBuildData,
	meta: ViteMetadata,
	pagesToCss: Record<string, Record<string, { order: number; depth: number }>>,
	depth: number,
	order: number,
	environmentName: string | undefined,
) {
	// In SSR/prerender builds, only add CSS to pages that match the current environment.
	// SSR build handles non-prerendered pages, prerender build handles prerendered pages.
	// Client build adds CSS to all pages.
	if (environmentName === ASTRO_VITE_ENVIRONMENT_NAMES.ssr && pageData.route.prerender) {
		return;
	}
	if (environmentName === ASTRO_VITE_ENVIRONMENT_NAMES.prerender && !pageData.route.prerender) {
		return;
	}

	for (const importedCssImport of meta.importedCss) {
		// CSS is prioritized based on depth. Shared CSS has a higher depth due to being imported by multiple pages.
		// Depth info is used when sorting the links on the page.
		const cssInfo = pagesToCss[pageData.moduleSpecifier]?.[importedCssImport];
		if (cssInfo !== undefined) {
			if (depth < cssInfo.depth) {
				cssInfo.depth = depth;
			}

			// Update the order, preferring the lowest order we have.
			if (cssInfo.order === -1) {
				cssInfo.order = order;
			} else if (order < cssInfo.order && order > -1) {
				cssInfo.order = order;
			}
		} else {
			const cssToInfoRecord = (pagesToCss[pageData.moduleSpecifier] ??= {});
			cssToInfoRecord[importedCssImport] = { depth, order };
		}
	}
}
