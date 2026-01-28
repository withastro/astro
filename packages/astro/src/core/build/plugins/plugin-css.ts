import type { GetModuleInfo } from 'rollup';
import type { BuildOptions, ResolvedConfig, Plugin as VitePlugin } from 'vite';
import { hasAssetPropagationFlag } from '../../../content/index.js';
import { isBuildableCSSRequest } from '../../../vite-plugin-astro-server/util.js';
import * as assetName from '../css-asset-name.js';
import {
	getParentExtendedModuleInfos,
	getParentModuleInfos,
	moduleIsTopLevelPage,
} from '../graph.js';
import type { BuildInternals } from '../internal.js';
import { getPageDataByViteID, getPageDatasByClientOnlyID } from '../internal.js';
import type { AstroBuildPlugin, BuildTarget } from '../plugin.js';
import type { PageBuildData, StaticBuildOptions, StylesheetAsset } from '../types.js';
import { normalizeEntryId } from './plugin-component-entry.js';
import { extendManualChunks, shouldInlineAsset } from './util.js';

interface PluginOptions {
	internals: BuildInternals;
	buildOptions: StaticBuildOptions;
	target: BuildTarget;
}

/***** ASTRO PLUGIN *****/

export function pluginCSS(
	options: StaticBuildOptions,
	internals: BuildInternals,
): AstroBuildPlugin {
	return {
		targets: ['client', 'server'],
		hooks: {
			'build:before': ({ target }) => {
				let plugins = rollupPluginAstroBuildCSS({
					buildOptions: options,
					internals,
					target,
				});

				return {
					vitePlugin: plugins,
				};
			},
		},
	};
}

/***** ROLLUP SUB-PLUGINS *****/

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

		outputOptions(outputOptions) {
			const assetFileNames = outputOptions.assetFileNames;
			const namingIncludesHash = assetFileNames?.toString().includes('[hash]');
			const createNameForParentPages = namingIncludesHash
				? assetName.shortHashedName(settings)
				: assetName.createSlugger(settings);

			extendManualChunks(outputOptions, {
				after(id, meta) {
					// For CSS, create a hash of all of the pages that use it.
					// This causes CSS to be built into shared chunks when used by multiple pages.
					if (isBuildableCSSRequest(id)) {
						// For client builds that has hydrated components as entrypoints, there's no way
						// to crawl up and find the pages that use it. So we lookup the cache during SSR
						// build (that has the pages information) to derive the same chunk id so they
						// match up on build, making sure both builds has the CSS deduped.
						// NOTE: Components that are only used with `client:only` may not exist in the cache
						// and that's okay. We can use Rollup's default chunk strategy instead as these CSS
						// are outside of the SSR build scope, which no dedupe is needed.
						if (options.target === 'client') {
							// Find the chunkId for this CSS module in the server build.
							// If it exists, we can use it to ensure the client build matches the server
							// build and doesn't create a duplicate chunk.
							return internals.cssModuleToChunkIdMap.get(id);
						}

						const ctx = { getModuleInfo: meta.getModuleInfo };
						for (const pageInfo of getParentModuleInfos(id, ctx)) {
							if (hasAssetPropagationFlag(pageInfo.id)) {
								// Split delayed assets to separate modules
								// so they can be injected where needed
								const chunkId = assetName.createNameHash(id, [id], settings);
								internals.cssModuleToChunkIdMap.set(id, chunkId);
								return chunkId;
							}
						}

						const chunkId = createNameForParentPages(id, meta);
						internals.cssModuleToChunkIdMap.set(id, chunkId);
						return chunkId;
					}
				},
			});
		},

		async generateBundle(_outputOptions, bundle) {
			// In the client build, collect which component modules have their exports rendered
			// and which pages/entries contain them. This is used to handle CSS with cssScopeTo
			// metadata for conditionally rendered components.
			const renderedComponentExports = new Map<string, string[]>();
			// Map from component module ID to the pages that include it (via facadeModuleId)
			const componentToPages = new Map<string, Set<string>>();
			if (options.target === 'client') {
				for (const [, asset] of Object.entries(bundle)) {
					if (asset.type === 'chunk') {
						for (const [moduleId, moduleRenderedInfo] of Object.entries(asset.modules)) {
							if (moduleRenderedInfo.renderedExports.length > 0) {
								renderedComponentExports.set(moduleId, moduleRenderedInfo.renderedExports);
								// Track which entry/page this component belongs to
								if (asset.facadeModuleId) {
									let pages = componentToPages.get(moduleId);
									if (!pages) {
										pages = new Set();
										componentToPages.set(moduleId, pages);
									}
									pages.add(asset.facadeModuleId);
								}
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
				if (options.target === 'client') {
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
											appendCSSToPage(pageData, meta, pagesToCss, depth, order);
										}
									}
									// For hydrated components, check if this parent is a script/component entry
									// that's tracked in pagesByScriptId
									const pageDatas = internals.pagesByScriptId.get(pageInfo.id);
									if (pageDatas) {
										for (const pageData of pageDatas) {
											appendCSSToPage(pageData, meta, pagesToCss, -1, order);
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
												appendCSSToPage(pageData, meta, pagesToCss, -1, -1);
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
								appendCSSToPage(pageData, meta, pagesToCss, depth, order);
							}
						} else if (options.target === 'client') {
							// For scripts, walk parents until you find a page, and add the CSS to that page.
							const pageDatas = internals.pagesByScriptId.get(pageInfo.id)!;
							if (pageDatas) {
								for (const pageData of pageDatas) {
									appendCSSToPage(pageData, meta, pagesToCss, -1, order);
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
) {
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
