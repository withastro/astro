import * as crypto from 'node:crypto';
import * as npath from 'node:path';
import type { GetModuleInfo } from 'rollup';
import { type Plugin as VitePlugin, type ResolvedConfig } from 'vite';
import { isBuildableCSSRequest } from '../../render/dev/util.js';
import type { BuildInternals } from '../internal';
import type { AstroBuildPlugin } from '../plugin';
import type { PageBuildData, StaticBuildOptions, StylesheetAsset } from '../types';

import { PROPAGATED_ASSET_FLAG } from '../../../content/consts.js';
import * as assetName from '../css-asset-name.js';
import { moduleIsTopLevelPage, walkParentInfos } from '../graph.js';
import {
	eachPageData,
	getPageDataByViteID,
	getPageDatasByClientOnlyID,
	getPageDatasByHoistedScriptId,
	isHoistedScript,
} from '../internal.js';
import { extendManualChunks } from './util.js';

interface PluginOptions {
	internals: BuildInternals;
	buildOptions: StaticBuildOptions;
	target: 'client' | 'server';
}

/***** ASTRO PLUGIN *****/

export function pluginCSS(
	options: StaticBuildOptions,
	internals: BuildInternals
): AstroBuildPlugin {
	return {
		build: 'both',
		hooks: {
			'build:before': ({ build }) => {
				let plugins = rollupPluginAstroBuildCSS({
					buildOptions: options,
					internals,
					target: build === 'ssr' ? 'server' : 'client',
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
	const pagesToPropagatedCss: Record<string, Record<string, Set<string>>> = {};

	const cssBuildPlugin: VitePlugin = {
		name: 'astro:rollup-plugin-build-css',

		outputOptions(outputOptions) {
			const assetFileNames = outputOptions.assetFileNames;
			const namingIncludesHash = assetFileNames?.toString().includes('[hash]');
			const createNameForParentPages = namingIncludesHash
				? assetName.shortHashedName
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
							return internals.cssModuleToChunkIdMap.get(id)!;
						}

						for (const [pageInfo] of walkParentInfos(id, {
							getModuleInfo: meta.getModuleInfo,
						})) {
							if (new URL(pageInfo.id, 'file://').searchParams.has(PROPAGATED_ASSET_FLAG)) {
								// Split delayed assets to separate modules
								// so they can be injected where needed
								const chunkId = createNameHash(id, [id]);
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
				}

				// For this CSS chunk, walk parents until you find a page. Add the CSS to that page.
				for (const id of Object.keys(chunk.modules)) {
					for (const [pageInfo, depth, order] of walkParentInfos(
						id,
						this,
						function until(importer) {
							return new URL(importer, 'file://').searchParams.has(PROPAGATED_ASSET_FLAG);
						}
					)) {
						if (new URL(pageInfo.id, 'file://').searchParams.has(PROPAGATED_ASSET_FLAG)) {
							for (const parent of walkParentInfos(id, this)) {
								const parentInfo = parent[0];
								if (moduleIsTopLevelPage(parentInfo) === false) continue;

								const pageViteID = parentInfo.id;
								const pageData = getPageDataByViteID(internals, pageViteID);
								if (pageData === undefined) continue;

								for (const css of meta.importedCss) {
									const propagatedStyles = (pagesToPropagatedCss[pageData.moduleSpecifier] ??= {});
									const existingCss = (propagatedStyles[pageInfo.id] ??= new Set());

									existingCss.add(css);
								}
							}
						} else if (moduleIsTopLevelPage(pageInfo)) {
							const pageViteID = pageInfo.id;
							const pageData = getPageDataByViteID(internals, pageViteID);
							if (pageData) {
								appendCSSToPage(pageData, meta, pagesToCss, depth, order);
							}
						} else if (options.target === 'client' && isHoistedScript(internals, pageInfo.id)) {
							for (const pageData of getPageDatasByHoistedScriptId(internals, pageInfo.id)) {
								appendCSSToPage(pageData, meta, pagesToCss, -1, order);
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
				(chunk) => chunk.type === 'asset' && chunk.name === 'style.css'
			);
			if (cssChunk === undefined) return;
			for (const pageData of eachPageData(internals)) {
				const cssToInfoMap = (pagesToCss[pageData.moduleSpecifier] ??= {});
				cssToInfoMap[cssChunk.fileName] = { depth: -1, order: -1 };
			}
		},
	};

	const inlineStylesheetsPlugin: VitePlugin = {
		name: 'astro:rollup-plugin-inline-stylesheets',
		enforce: 'post',
		async generateBundle(_outputOptions, bundle) {
			const inlineConfig = settings.config.build.inlineStylesheets;
			const { assetsInlineLimit = 4096 } = settings.config.vite?.build ?? {};

			Object.entries(bundle).forEach(([id, stylesheet]) => {
				if (
					stylesheet.type !== 'asset' ||
					stylesheet.name?.endsWith('.css') !== true ||
					typeof stylesheet.source !== 'string'
				)
					return;

				const assetSize = new TextEncoder().encode(stylesheet.source).byteLength;

				const toBeInlined =
					inlineConfig === 'always'
						? true
						: inlineConfig === 'never'
						? false
						: assetSize <= assetsInlineLimit;

				if (toBeInlined) delete bundle[id];

				// there should be a single js object for each stylesheet,
				// allowing the single reference to be shared and checked for duplicates
				const sheet: StylesheetAsset = toBeInlined
					? { type: 'inline', content: stylesheet.source }
					: { type: 'external', src: stylesheet.fileName };

				const pages = Array.from(eachPageData(internals));

				pages.forEach((pageData) => {
					const orderingInfo = pagesToCss[pageData.moduleSpecifier]?.[stylesheet.fileName];
					if (orderingInfo !== undefined) return pageData.styles.push({ ...orderingInfo, sheet });

					const propagatedPaths = pagesToPropagatedCss[pageData.moduleSpecifier];
					if (propagatedPaths === undefined) return;
					Object.entries(propagatedPaths).forEach(([pageInfoId, css]) => {
						// return early if sheet does not need to be propagated
						if (css.has(stylesheet.fileName) !== true) return;

						// return early if the stylesheet needing propagation has already been included
						if (pageData.styles.some((s) => s.sheet === sheet)) return;

						const propagatedStyles =
							pageData.propagatedStyles.get(pageInfoId) ??
							pageData.propagatedStyles.set(pageInfoId, new Set()).get(pageInfoId)!;

						propagatedStyles.add(sheet);
					});
				});
			});
		},
	};

	return [cssBuildPlugin, singleCssPlugin, inlineStylesheetsPlugin];
}

/***** UTILITY FUNCTIONS *****/

function createNameHash(baseId: string, hashIds: string[]): string {
	const baseName = baseId ? npath.parse(baseId).name : 'index';
	const hash = crypto.createHash('sha256');
	for (const id of hashIds) {
		hash.update(id, 'utf-8');
	}
	const h = hash.digest('hex').slice(0, 8);
	const proposedName = baseName + '.' + h;
	return proposedName;
}

function* getParentClientOnlys(
	id: string,
	ctx: { getModuleInfo: GetModuleInfo },
	internals: BuildInternals
): Generator<PageBuildData, void, unknown> {
	for (const [info] of walkParentInfos(id, ctx)) {
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
	order: number
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
