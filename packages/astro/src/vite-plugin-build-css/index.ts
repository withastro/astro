import type { GetModuleInfo, ModuleInfo } from 'rollup';
import { BuildInternals } from '../core/build/internal';
import type { PageBuildData } from '../core/build/types';

import crypto from 'crypto';
import esbuild from 'esbuild';
import { Plugin as VitePlugin } from 'vite';
import { resolvedPagesVirtualModuleId } from '../core/app/index.js';
import { getPageDataByViteID, getPageDatasByClientOnlyID } from '../core/build/internal.js';
import { isCSSRequest } from '../core/render/util.js';

interface PluginOptions {
	internals: BuildInternals;
	target: 'client' | 'server';
}

export function rollupPluginAstroBuildCSS(options: PluginOptions): VitePlugin[] {
	const { internals } = options;

	// This walks up the dependency graph and yields out each ModuleInfo object.
	function* walkParentInfos(
		id: string,
		ctx: { getModuleInfo: GetModuleInfo },
		seen = new Set<string>()
	): Generator<ModuleInfo, void, unknown> {
		seen.add(id);
		const info = ctx.getModuleInfo(id);
		if (info) {
			yield info;
		}
		const importers = (info?.importers || []).concat(info?.dynamicImporters || []);
		for (const imp of importers) {
			if (seen.has(imp)) {
				continue;
			}
			yield* walkParentInfos(imp, ctx, seen);
		}
	}

	// This function walks the dependency graph, going up until it finds a page component.
	// This could be a .astro page or a .md page.
	function* getTopLevelPages(
		id: string,
		ctx: { getModuleInfo: GetModuleInfo }
	): Generator<string, void, unknown> {
		for (const info of walkParentInfos(id, ctx)) {
			const importers = (info?.importers || []).concat(info?.dynamicImporters || []);
			if (importers.length <= 2 && importers[0] === resolvedPagesVirtualModuleId) {
				yield info.id;
			}
		}
	}

	function createHashOfPageParents(id: string, ctx: { getModuleInfo: GetModuleInfo }): string {
		const parents = Array.from(getTopLevelPages(id, ctx)).sort();
		const hash = crypto.createHash('sha256');
		for (const page of parents) {
			hash.update(page, 'utf-8');
		}
		return hash.digest('hex').slice(0, 8);
	}

	function* getParentClientOnlys(
		id: string,
		ctx: { getModuleInfo: GetModuleInfo }
	): Generator<PageBuildData, void, unknown> {
		for (const info of walkParentInfos(id, ctx)) {
			yield* getPageDatasByClientOnlyID(internals, info.id);
		}
	}

	const CSS_PLUGIN_NAME = '@astrojs/rollup-plugin-build-css';
	const CSS_MINIFY_PLUGIN_NAME = '@astrojs/rollup-plugin-build-css-minify';

	return [{
		name: CSS_PLUGIN_NAME,

		configResolved(resolvedConfig) {
			// Our plugin needs to run before `vite:css-post` because we have to modify
			// The bundles before vite:css-post sees them. We can remove this code
			// after this bug is fixed: https://github.com/vitejs/vite/issues/8330
			const plugins = resolvedConfig.plugins as VitePlugin[];
			const viteCSSPostIndex = resolvedConfig.plugins.findIndex((p) => p.name === 'vite:css-post');
			if (viteCSSPostIndex !== -1) {
				// Move our plugin to be right before this one.
				const ourIndex = plugins.findIndex((p) => p.name === CSS_PLUGIN_NAME);
				const ourPlugin = plugins[ourIndex];

				// Remove us from where we are now and place us right before the viteCSSPost plugin
				plugins.splice(ourIndex, 1);
				plugins.splice(viteCSSPostIndex - 1, 0, ourPlugin);
			}
		},

		outputOptions(outputOptions) {
			const manualChunks = outputOptions.manualChunks || Function.prototype;
			outputOptions.manualChunks = function (id, ...args) {
				// Defer to user-provided `manualChunks`, if it was provided.
				if (typeof manualChunks == 'object') {
					if (id in manualChunks) {
						return manualChunks[id];
					}
				} else if (typeof manualChunks === 'function') {
					const outid = manualChunks.call(this, id, ...args);
					if (outid) {
						return outid;
					}
				}

				// For CSS, create a hash of all of the pages that use it.
				// This causes CSS to be built into shared chunks when used by multiple pages.
				if (isCSSRequest(id)) {
					return createHashOfPageParents(id, args[0]);
				}
			};
		},

		async generateBundle(_outputOptions, bundle) {
			type ViteMetadata = {
				importedAssets: Set<string>;
				importedCss: Set<string>;
			};

			for (const [_, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'chunk') {
					const c = chunk;
					if ('viteMetadata' in chunk) {
						const meta = chunk['viteMetadata'] as ViteMetadata;

						// Chunks that have the viteMetadata.importedCss are CSS chunks
						if (meta.importedCss.size) {
							// For the client build, client:only styles need to be mapped
							// over to their page. For this chunk, determine if it's a child of a
							// client:only component and if so, add its CSS to the page it belongs to.
							if (options.target === 'client') {
								for (const [id] of Object.entries(c.modules)) {
									for (const pageData of getParentClientOnlys(id, this)) {
										for (const importedCssImport of meta.importedCss) {
											pageData.css.add(importedCssImport);
										}
									}
								}
							}

							// For this CSS chunk, walk parents until you find a page. Add the CSS to that page.
							for (const [id] of Object.entries(c.modules)) {
								for (const pageViteID of getTopLevelPages(id, this)) {
									const pageData = getPageDataByViteID(internals, pageViteID);
									for (const importedCssImport of meta.importedCss) {
										pageData?.css.add(importedCssImport);
									}
								}
							}
						}
					}
				}

				if (chunk.type === 'chunk') {
					// This simply replaces single quotes with double quotes because the vite:css-post
					// plugin only works with single for some reason. This code can be removed
					// When the Vite bug is fixed: https://github.com/vitejs/vite/issues/8330
					const exp = new RegExp(
						`(\\bimport\\s*)[']([^']*(?:[a-z]+\.[0-9a-z]+\.m?js))['](;\n?)`,
						'g'
					);
					chunk.code = chunk.code.replace(exp, (_match, begin, chunkPath, end) => {
						return begin + '"' + chunkPath + '"' + end;
					});
				}
			}
		},
	}, {
		name: CSS_MINIFY_PLUGIN_NAME,
		enforce: 'post',
		async generateBundle(_outputOptions, bundle) {
			// Minify CSS in each bundle ourselves, since server builds are not minified
			// so that the JS is debuggable. Since you cannot configure vite:css-post to minify
			// we need to do it ourselves.
			if(options.target === 'server') {
				for(const [, output] of Object.entries(bundle)) {
					if(output.type === 'asset') {
						if(output.name?.endsWith('.css') && typeof output.source === 'string') {
							const { code: minifiedCSS } = await esbuild.transform(output.source, {
								loader: 'css',
								minify: true,
							});
							output.source = minifiedCSS;
						}
					}
				}
			}
		}
	}];
}
