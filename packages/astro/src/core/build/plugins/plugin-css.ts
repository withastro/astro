import * as crypto from 'node:crypto';
import * as npath from 'node:path';
import type { GetModuleInfo } from 'rollup';
import { transformWithEsbuild, type ResolvedConfig, type Plugin as VitePlugin } from 'vite';
import { isBuildableCSSRequest } from '../../render/dev/util.js';
import type { BuildInternals } from '../internal';
import type { AstroBuildPlugin } from '../plugin';
import type { PageBuildData, StaticBuildOptions } from '../types';

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

export function rollupPluginAstroBuildCSS(options: PluginOptions): VitePlugin[] {
	const { internals, buildOptions } = options;
	const { settings } = buildOptions;

	let resolvedConfig: ResolvedConfig;

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
		ctx: { getModuleInfo: GetModuleInfo }
	): Generator<PageBuildData, void, unknown> {
		for (const [info] of walkParentInfos(id, ctx)) {
			yield* getPageDatasByClientOnlyID(internals, info.id);
		}
	}

	return [
		{
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
							for (const [pageInfo] of walkParentInfos(id, {
								getModuleInfo: meta.getModuleInfo,
							})) {
								if (new URL(pageInfo.id, 'file://').searchParams.has(PROPAGATED_ASSET_FLAG)) {
									// Split delayed assets to separate modules
									// so they can be injected where needed
									return createNameHash(id, [id]);
								}
							}
							return createNameForParentPages(id, meta);
						}
					},
				});
			},

			async generateBundle(_outputOptions, bundle) {
				type ViteMetadata = {
					importedAssets: Set<string>;
					importedCss: Set<string>;
				};

				const appendCSSToPage = (
					pageData: PageBuildData,
					meta: ViteMetadata,
					depth: number,
					order: number
				) => {
					for (const importedCssImport of meta.importedCss) {
						// CSS is prioritized based on depth. Shared CSS has a higher depth due to being imported by multiple pages.
						// Depth info is used when sorting the links on the page.
						if (pageData?.css.has(importedCssImport)) {
							// eslint-disable-next-line
							const cssInfo = pageData?.css.get(importedCssImport)!;
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
							pageData?.css.set(importedCssImport, { depth, order });
						}
					}
				};

				for (const [_, chunk] of Object.entries(bundle)) {
					if (chunk.type === 'chunk') {
						const c = chunk;

						if ('viteMetadata' in chunk) {
							const meta = chunk['viteMetadata'] as ViteMetadata;

							// Chunks that have the viteMetadata.importedCss are CSS chunks
							if (meta.importedCss.size) {
								// In the SSR build, keep track of all CSS chunks' modules as the client build may
								// duplicate them, e.g. for `client:load` components that render in SSR and client
								// for hydation.
								if (options.target === 'server') {
									for (const id of Object.keys(c.modules)) {
										internals.cssChunkModuleIds.add(id);
									}
								}
								// In the client build, we bail if the chunk is a duplicated CSS chunk tracked from
								// above. We remove all the importedCss to prevent emitting the CSS asset.
								if (options.target === 'client') {
									if (Object.keys(c.modules).every((id) => internals.cssChunkModuleIds.has(id))) {
										for (const importedCssImport of meta.importedCss) {
											delete bundle[importedCssImport];
											meta.importedCss.delete(importedCssImport);
										}
										return;
									}
								}

								// For the client build, client:only styles need to be mapped
								// over to their page. For this chunk, determine if it's a child of a
								// client:only component and if so, add its CSS to the page it belongs to.
								if (options.target === 'client') {
									for (const id of Object.keys(c.modules)) {
										for (const pageData of getParentClientOnlys(id, this)) {
											for (const importedCssImport of meta.importedCss) {
												pageData.css.set(importedCssImport, { depth: -1, order: -1 });
											}
										}
									}
								}

								// For this CSS chunk, walk parents until you find a page. Add the CSS to that page.
								for (const id of Object.keys(c.modules)) {
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
												if (moduleIsTopLevelPage(parentInfo)) {
													const pageViteID = parentInfo.id;
													const pageData = getPageDataByViteID(internals, pageViteID);
													if (pageData) {
														for (const css of meta.importedCss) {
															const existingCss =
																pageData.propagatedStyles.get(pageInfo.id) ?? new Set();
															pageData.propagatedStyles.set(
																pageInfo.id,
																new Set([...existingCss, css])
															);
														}
													}
												}
											}
										} else if (moduleIsTopLevelPage(pageInfo)) {
											const pageViteID = pageInfo.id;
											const pageData = getPageDataByViteID(internals, pageViteID);
											if (pageData) {
												appendCSSToPage(pageData, meta, depth, order);
											}
										} else if (
											options.target === 'client' &&
											isHoistedScript(internals, pageInfo.id)
										) {
											for (const pageData of getPageDatasByHoistedScriptId(
												internals,
												pageInfo.id
											)) {
												appendCSSToPage(pageData, meta, -1, order);
											}
										}
									}
								}
							}
						}
					}
				}
			},
		},
		{
			name: 'astro:rollup-plugin-single-css',
			enforce: 'post',
			configResolved(config) {
				resolvedConfig = config;
			},
			generateBundle(_, bundle) {
				// If user disable css code-splitting, search for Vite's hardcoded
				// `style.css` and add it as css for each page.
				// Ref: https://github.com/vitejs/vite/blob/b2c0ee04d4db4a0ef5a084c50f49782c5f88587c/packages/vite/src/node/plugins/html.ts#L690-L705
				if (!resolvedConfig.build.cssCodeSplit) {
					const cssChunk = Object.values(bundle).find(
						(chunk) => chunk.type === 'asset' && chunk.name === 'style.css'
					);
					if (cssChunk) {
						for (const pageData of eachPageData(internals)) {
							pageData.css.set(cssChunk.fileName, { depth: -1, order: -1 });
						}
					}
				}
			},
		},
		{
			name: 'astro:rollup-plugin-build-css-minify',
			enforce: 'post',
			async generateBundle(_outputOptions, bundle) {
				// Minify CSS in each bundle ourselves, since server builds are not minified
				// so that the JS is debuggable. Since you cannot configure vite:css-post to minify
				// we need to do it ourselves.
				if (options.target === 'server') {
					for (const [, output] of Object.entries(bundle)) {
						if (output.type === 'asset') {
							if (output.name?.endsWith('.css') && typeof output.source === 'string') {
								const cssTarget = settings.config.vite.build?.cssTarget;
								const minify = settings.config.vite.build?.minify !== false;
								const { code: minifiedCSS } = await transformWithEsbuild(
									output.source,
									output.name,
									{
										loader: 'css',
										minify,
										target: cssTarget || undefined,
										sourcemap: false,
									}
								);
								output.source = minifiedCSS;
							}
						}
					}
				}
			},
		},
	];
}

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
