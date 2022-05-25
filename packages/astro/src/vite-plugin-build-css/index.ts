import { BuildInternals } from '../core/build/internal';
import type { GetModuleInfo, ModuleInfo } from 'rollup';
import type { PageBuildData } from '../core/build/types';

import { Plugin as VitePlugin } from 'vite';
import { isCSSRequest } from '../core/render/util.js';
import { getPageDataByViteID, getPageDatasByClientOnlyID } from '../core/build/internal.js';
import { resolvedPagesVirtualModuleId } from '../core/app/index.js';
import crypto from 'crypto';

const PLUGIN_NAME = '@astrojs/rollup-plugin-build-css';

// This is a virtual module that represents the .astro <style> usage on a page
const ASTRO_STYLE_PREFIX = '@astro-inline-style';

const ASTRO_PAGE_STYLE_PREFIX = '@astro-page-all-styles';

function isStyleVirtualModule(id: string) {
	return id.startsWith(ASTRO_STYLE_PREFIX);
}

function isPageStyleVirtualModule(id: string) {
	return id.startsWith(ASTRO_PAGE_STYLE_PREFIX);
}

interface PluginOptions {
	internals: BuildInternals;
	target: 'client' | 'server';
}

export function rollupPluginAstroBuildCSS(options: PluginOptions): VitePlugin {
	const { internals } = options;
	const styleSourceMap = new Map<string, string>();

	function* walkParentInfos(id: string, ctx: {getModuleInfo: GetModuleInfo}, seen = new Set<string>()): Generator<ModuleInfo, void, unknown> {
		seen.add(id);
		const info = ctx.getModuleInfo(id);
		if(info) {
			yield info;
		}
		const importers = (info?.importers || []).concat(info?.dynamicImporters || []);
		for(const imp of importers) {
			if(seen.has(imp)) {
				continue;
			}
			yield * walkParentInfos(imp, ctx, seen);
		}
	}

	function* getTopLevelPages(id: string, ctx: {getModuleInfo: GetModuleInfo}, seen = new Set<string>()): Generator<string, void, unknown> {
		seen.add(id);
		const info = ctx.getModuleInfo(id);
		const importers = (info?.importers || []).concat(info?.dynamicImporters || []);
		if(importers.length === 1 && importers[0] === resolvedPagesVirtualModuleId) {
			yield id;
			return;
		}
		for(const imp of importers) {
			if(seen.has(imp)) {
				continue;
			}
			yield * getTopLevelPages(imp, ctx, seen);
		}
	}

	function createHashOfPageParents(id: string, ctx: {getModuleInfo: GetModuleInfo}): string {
		const parents = Array.from(getTopLevelPages(id, ctx)).sort();
		const hash = crypto.createHash('sha256');
		for(const page of parents) {
			hash.update(page, 'utf-8');
		}
		return hash.digest('hex').slice(0, 8);
	}

	function* getParentClientOnlys(id: string, ctx: {getModuleInfo: GetModuleInfo}): Generator<PageBuildData, void, unknown> {
		for(const info of walkParentInfos(id, ctx)) {
			yield * getPageDatasByClientOnlyID(internals, info.id);
		}
	}

	return {
		name: PLUGIN_NAME,

		configResolved(resolvedConfig) {
			// Our plugin needs to run before `vite:css-post` which does a lot of what we do
			// for bundling CSS, but since we need to control CSS we should go first.
			// We move to right before the vite:css-post plugin so that things like the
			// Vue plugin go before us.
			const plugins = resolvedConfig.plugins as VitePlugin[];
			const viteCSSPostIndex = resolvedConfig.plugins.findIndex((p) => p.name === 'vite:css-post');
			if (viteCSSPostIndex !== -1) {
				const viteCSSPost = plugins[viteCSSPostIndex];
				// Prevent this plugin's bundling behavior from running since we need to
				// do that ourselves in order to handle updating the HTML.
			//	delete viteCSSPost.renderChunk;
			//	delete viteCSSPost.generateBundle;

				// Move our plugin to be right before this one.
				const ourIndex = plugins.findIndex((p) => p.name === PLUGIN_NAME);
				const ourPlugin = plugins[ourIndex];

				// Remove us from where we are now and place us right before the viteCSSPost plugin
				plugins.splice(ourIndex, 1);
				plugins.splice(viteCSSPostIndex - 1, 0, ourPlugin);
			}
		},
		async resolveId(id) {
			if (isPageStyleVirtualModule(id)) {
				return id;
			}
			if (isStyleVirtualModule(id)) {
				return id;
			}
			return undefined;
		},

		async transform(value, id) {
			if (isStyleVirtualModule(id)) {
				styleSourceMap.set(id, value);
			}
			if (isCSSRequest(id)) {
				styleSourceMap.set(id, value);
			}
			return null;
		},

		outputOptions(outputOptions) {
			const manualChunks = outputOptions.manualChunks || Function.prototype;
			outputOptions.manualChunks = function(id, ...args) {
				if(typeof manualChunks == 'object') {
					if(id in manualChunks) {
						return manualChunks[id];
					}
				} else if(typeof manualChunks === 'function') {
					const outid = manualChunks.call(this, id, ...args);
					if(outid) {
						return outid;
					}
				}

				if (isCSSRequest(id)) {
					return createHashOfPageParents(id, args[0]);
				}
			};
		},

		async generateBundle(_outputOptions, bundle) {
			type ViteMetadata = {
				importedAssets: Set<string>;
				importedCss: Set<string>;
			}

			for (const [_, chunk] of Object.entries(bundle)) {
				if(chunk.type === 'chunk') {
					const c = chunk;
					if('viteMetadata' in chunk) {
						const meta = chunk['viteMetadata'] as ViteMetadata;

						if(meta.importedCss.size) {
							if(options.target === 'client') {
								for(const [id] of Object.entries(c.modules)) {
									for(const pageData of getParentClientOnlys(id, this)) {
										for(const importedCssImport of meta.importedCss) {
											pageData.css.add(importedCssImport);
										}
									}
								}
							}

							for(const [id] of Object.entries(c.modules)) {
								for(const pageViteID of getTopLevelPages(id, this)) {
									const pageData = getPageDataByViteID(internals, pageViteID);
									for(const importedCssImport of meta.importedCss) {
										pageData?.css.add(importedCssImport);
									}
								}
							}
						}
					}
				}

				if (chunk.type === 'chunk') {
					// This simply replaces single quotes with double quotes because the vite:css-post 
					// plugin only works with single for some reason. See bug:
					const exp = new RegExp(`(\\bimport\\s*)[']([^']*(?:[a-z]+\.[0-9a-z]+\.m?js))['](;\n?)`, 'g');
					chunk.code = chunk.code.replace(exp, (_match, begin, chunkPath, end) => {
						return begin + '"' + chunkPath + '"' + end;
					});
				}
			}
		}
	};
}
