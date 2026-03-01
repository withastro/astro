import type { GetModuleInfo } from 'rollup';
import type { BuildOptions, ResolvedConfig, Plugin as VitePlugin } from 'vite';
import { isCSSRequest } from 'vite';
import { hasAssetPropagationFlag } from '../../../content/index.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../constants.js';
import {
	getParentExtendedModuleInfos,
	getParentModuleInfos,
	moduleIsTopLevelPage,
} from '../graph.js';
import type { BuildInternals } from '../internal.js';
import { getPageDataByViteID, getPageDatasByClientOnlyID } from '../internal.js';
import type { PageBuildData, StaticBuildOptions, StylesheetAsset } from '../types.js';
import { normalizeEntryId } from './plugin-component-entry.js';
import { shouldInlineAsset } from './util.js';

/***** ASTRO PLUGIN *****/

export function pluginCSS(options: StaticBuildOptions, internals: BuildInternals): VitePlugin[] {
	return rollupPluginAstroBuildCSS({
		buildOptions: options,
		internals,
	});
}

/***** ROLLUP SUB-PLUGINS *****/

interface PluginOptions {
	internals: BuildInternals;
	buildOptions: StaticBuildOptions;
}

function rollupPluginAstroBuildCSS(options: PluginOptions): VitePlugin[] {
	const { internals, buildOptions } = options;
	const { settings } = buildOptions;

	let resolvedConfig: ResolvedConfig;

	// stylesheet filenames are kept in here until "post", when they are rendered and ready to be inlined
	const pagesToCss: Record<string, Record<string, { order: number; depth: number }>> = {};
	// Map of module Ids (usually something like `/Users/...blog.mdx?astroPropagatedAssets`) to its imported CSS
	const moduleIdToPropagatedCss: Record<string, Set<string>> = {};

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
			// Collect CSS modules that were bundled during SSR build for deduplication in client build
			if (
				this.environment?.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				this.environment?.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
			) {
				for (const [, chunk] of Object.entries(bundle)) {
					if (chunk.type !== 'chunk') continue;

					// Track all CSS modules that are bundled during SSR
					// so we can avoid creating separate CSS files for them in client build
					for (const moduleId of Object.keys(chunk.modules || {})) {
						if (isCSSRequest(moduleId)) {
							internals.cssModuleToChunkIdMap.set(moduleId, chunk.fileName);
						}
					}
				}
			}

			// In the client build, collect which component modules have their exports rendered
			// and which pages/entries contain them. This is used to handle CSS with cssScopeTo
			// metadata for conditionally rendered components.
			const renderedComponentExports = new Map<string, string[]>();
			// Map from component module ID to the pages that include it (via facadeModuleId)
			const componentToPages = new Map<string, Set<string>>();

			// Remove CSS files from client bundle that were already bundled with pages during SSR
			if (this.environment?.name === ASTRO_VITE_ENVIRONMENT_NAMES.client) {
				for (const [, item] of Object.entries(bundle)) {
					if (item.type !== 'chunk') continue;

					for (const [moduleId, moduleRenderedInfo] of Object.entries(item.modules)) {
						if (moduleRenderedInfo.renderedExports.length > 0) {
							renderedComponentExports.set(moduleId, moduleRenderedInfo.renderedExports);
							// Track which entry/page this component belongs to
							if (item.facadeModuleId) {
								let pages = componentToPages.get(moduleId);
								if (!pages) {
									pages = new Set();
									componentToPages.set(moduleId, pages);
								}
								pages.add(item.facadeModuleId);
							}
						}
					}

					if ('viteMetadata' in item === false) continue;
					const meta = item.viteMetadata as ViteMetadata;

					// Check if this chunk contains CSS modules that were already in SSR
					const allModules = Object.keys(item.modules || {});
					const cssModules = allModules.filter((m) => isCSSRequest(m));

					if (cssModules.length > 0) {
						// Check if ALL CSS modules in this chunk were already bundled in SSR
						const allCssInSSR = cssModules.every((moduleId) =>
							internals.cssModuleToChunkIdMap.has(moduleId),
						);

						if (allCssInSSR && shouldDeleteCSSChunk(allModules, internals)) {
							// Delete the CSS assets that were imported by this chunk
							for (const cssId of meta.importedCss) {
								delete bundle[cssId];
							}
						}
					}
				}
			}

			for (const [, chunk] of Object.entries(bundle)) {
				if (chunk.type !== 'chunk') continue;
				if ('viteMetadata' in chunk === false) continue;
				const meta = chunk.viteMetadata as ViteMetadata;

				// Skip if the chunk has no CSS, we want to handle CSS chunks only
				if (meta.importedCss.size < 1) continue;

				// For the client build, client:only styles need to be mapped
				// over to their page. For this chunk, determine if it's a child of a
				// client:only component and if so, add its CSS to the page it belongs to.
				if (this.environment?.name === ASTRO_VITE_ENVIRONMENT_NAMES.client) {
					for (const id of Object.keys(chunk.modules)) {
						for (const pageData of getParentClientOnlys(id, this, internals)) {
							for (const importedCssImport of meta.importedCss) {
								const cssToInfoRecord = (pagesToCss[pageData.moduleSpecifier] ??= {});
								cssToInfoRecord[importedCssImport] = { depth: -1, order: -1 };
							}
						}
					}

					// Handle CSS with cssScopeTo metadata for conditionally rendered components.
					// These components may not be in the server build (due to conditional rendering)
					// but are in the client build. We need to ensure their CSS is included.
					for (const id of Object.keys(chunk.modules)) {
						const moduleInfo = this.getModuleInfo(id);
						const cssScopeTo = moduleInfo?.meta?.vite?.cssScopeTo as [string, string] | undefined;
						if (cssScopeTo) {
							const [scopedToModule, scopedToExport] = cssScopeTo;
							const renderedExports = renderedComponentExports.get(scopedToModule);
							// If the component's export is rendered in the client build,
							// ensure its CSS is associated with the pages that use it
							if (renderedExports?.includes(scopedToExport)) {
								// Walk up from the scoped-to module to find pages or scripts
								const parentModuleInfos = getParentExtendedModuleInfos(
									scopedToModule,
									this,
									hasAssetPropagationFlag,
								);
								for (const { info: pageInfo, depth, order } of parentModuleInfos) {
									if (moduleIsTopLevelPage(pageInfo)) {
										const pageData = getPageDataByViteID(internals, pageInfo.id);
										if (pageData) {
											appendCSSToPage(
												pageData,
												meta,
												pagesToCss,
												depth,
												order,
												this.environment?.name,
											);
										}
									}
									// For hydrated components, check if this parent is a script/component entry
									// that's tracked in pagesByScriptId
									const pageDatas = internals.pagesByScriptId.get(pageInfo.id);
									if (pageDatas) {
										for (const pageData of pageDatas) {
											appendCSSToPage(
												pageData,
												meta,
												pagesToCss,
												-1,
												order,
												this.environment?.name,
											);
										}
									}
								}

								// If we couldn't find a page through normal traversal,
								// check if any parent in the chain is a hydrated component and
								// use the pagesByHydratedComponent mapping from the server build.
								let addedToAnyPage = false;
								for (const importedCssImport of meta.importedCss) {
									for (const pageData of internals.pagesByKeys.values()) {
										const cssToInfoRecord = pagesToCss[pageData.moduleSpecifier];
										if (cssToInfoRecord && importedCssImport in cssToInfoRecord) {
											addedToAnyPage = true;
											break;
										}
									}
								}
								if (!addedToAnyPage) {
									// Walk up the parent chain and check if any parent is a hydrated component
									for (const { info: parentInfo } of parentModuleInfos) {
										const normalizedParent = normalizeEntryId(parentInfo.id);
										// Check if this parent is tracked as a hydrated component
										const pages = internals.pagesByHydratedComponent.get(normalizedParent);
										if (pages) {
											for (const pageData of pages) {
												appendCSSToPage(pageData, meta, pagesToCss, -1, -1, this.environment?.name);
											}
										}
									}
								}
							}
						}
					}
				}

				// For this CSS chunk, walk parents until you find a page. Add the CSS to that page.
				for (const id of Object.keys(chunk.modules)) {
					// Only walk up for dependencies that are CSS
					if (!isCSSRequest(id)) continue;

					const parentModuleInfos = getParentExtendedModuleInfos(id, this, hasAssetPropagationFlag);
					for (const { info: pageInfo, depth, order } of parentModuleInfos) {
						if (hasAssetPropagationFlag(pageInfo.id)) {
							const propagatedCss = (moduleIdToPropagatedCss[pageInfo.id] ??= new Set());
							for (const css of meta.importedCss) {
								propagatedCss.add(css);
							}
						} else if (moduleIsTopLevelPage(pageInfo)) {
							const pageViteID = pageInfo.id;
							const pageData = getPageDataByViteID(internals, pageViteID);
							if (pageData) {
								appendCSSToPage(pageData, meta, pagesToCss, depth, order, this.environment?.name);
							}
						} else if (this.environment?.name === ASTRO_VITE_ENVIRONMENT_NAMES.client) {
							// For scripts, walk parents until you find a page, and add the CSS to that page.
							const pageDatas = internals.pagesByScriptId.get(pageInfo.id)!;
							if (pageDatas) {
								for (const pageData of pageDatas) {
									appendCSSToPage(pageData, meta, pagesToCss, -1, order, this.environment?.name);
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
				// stylesheets already referenced as an asset by a chunk will not be inlined by
				// this plugin, but should not be considered orphaned
				const wasAddedToChunk = Object.values(bundle).some(
					(chunk) => chunk.type === 'chunk' && chunk.viteMetadata?.importedAssets?.has(id),
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
 * Check if a CSS chunk should be deleted. Only delete if it contains client-only or hydrated
 * components that are NOT also used on other pages.
 */
function shouldDeleteCSSChunk(allModules: string[], internals: BuildInternals): boolean {
	// Find all components in this chunk that are client-only or hydrated
	const componentPaths = new Set<string>();

	for (const componentPath of internals.discoveredClientOnlyComponents.keys()) {
		if (allModules.some((m) => m.includes(componentPath))) {
			componentPaths.add(componentPath);
		}
	}

	for (const componentPath of internals.discoveredHydratedComponents.keys()) {
		if (allModules.some((m) => m.includes(componentPath))) {
			componentPaths.add(componentPath);
		}
	}

	// If no special components found, don't delete
	if (componentPaths.size === 0) return false;

	// Check if any component is used on non-client-only pages
	for (const componentPath of componentPaths) {
		const pagesUsingClientOnly = internals.pagesByClientOnly.get(componentPath);
		if (pagesUsingClientOnly) {
			// If every page using this component is in the client-only set, it's safe to delete
			// Otherwise, keep the CSS for pages that use it normally
			for (const pageData of internals.pagesByKeys.values()) {
				if (!pagesUsingClientOnly.has(pageData)) {
					return false;
				}
			}
		}
	}

	return true;
}

function* getParentClientOnlys(
	id: string,
	ctx: { getModuleInfo: GetModuleInfo },
	internals: BuildInternals,
): Generator<PageBuildData, void, unknown> {
	for (const info of getParentModuleInfos(id, ctx)) {
		yield* getPageDatasByClientOnlyID(internals, info.id);
	}
}

type ViteMetadata = {
	importedAssets: Set<string>;
	importedCss: Set<string>;
};

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
