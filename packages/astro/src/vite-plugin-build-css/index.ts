import { BuildInternals } from '../core/build/internal';
import type { ModuleInfo, PluginContext } from 'rollup';

import * as path from 'path';
import esbuild from 'esbuild';
import { Plugin as VitePlugin } from 'vite';
import { isCSSRequest } from '../core/render/dev/css.js';
import { getPageDatasByChunk, getPageDataByViteID, hasPageDataByViteID } from '../core/build/internal.js';
import { resolvedVirtualModuleId as virtualPagesModuleId } from '../core/build/vite-plugin-pages.js';

const PLUGIN_NAME = '@astrojs/rollup-plugin-build-css';

// This is a virtual module that represents the .astro <style> usage on a page
const ASTRO_STYLE_PREFIX = '@astro-inline-style';

const ASTRO_PAGE_STYLE_PREFIX = '@astro-page-all-styles';

export function getAstroPageStyleId(pathname: string) {
	let styleId = ASTRO_PAGE_STYLE_PREFIX + pathname;
	if (styleId.endsWith('/')) {
		styleId += 'index';
	}
	styleId += '.js';
	return styleId;
}

export function getAstroStyleId(pathname: string) {
	let styleId = ASTRO_STYLE_PREFIX + pathname;
	if (styleId.endsWith('/')) {
		styleId += 'index';
	}
	return styleId;
}

export function getAstroStylePathFromId(id: string) {
	return id.substr(ASTRO_STYLE_PREFIX.length + 1);
}

function isStyleVirtualModule(id: string) {
	return id.startsWith(ASTRO_STYLE_PREFIX);
}

function isPageStyleVirtualModule(id: string) {
	return id.startsWith(ASTRO_PAGE_STYLE_PREFIX);
}

interface PluginOptions {
	internals: BuildInternals;
	legacy: boolean;
}

export function rollupPluginAstroBuildCSS(options: PluginOptions): VitePlugin {
	const { internals, legacy } = options;
	const styleSourceMap = new Map<string, string>();

	function * walkStyles(ctx: PluginContext, id: string, seen = new Set<string>()): Generator<[string, string], void, unknown> {
		seen.add(id);
		if(styleSourceMap.has(id)) {
			yield [id, styleSourceMap.get(id)!];
		}

		const info = ctx.getModuleInfo(id);
		if(info) {
			for(const importedId of info.importedIds) {
				if(!seen.has(importedId)) {
					yield * walkStyles(ctx, importedId, seen);
				}
			}
		}
	}

	/**
	 * This walks the dependency graph looking for styles that are imported
	 * by a page and then creates a chunking containing all of the styles for that page.
	 * Since there is only 1 entrypoint for the entire app, we do this in order
	 * to prevent adding all styles to all pages.
	 */
	async function addStyles(this: PluginContext) {
		for(const id of this.getModuleIds()) {
			if(hasPageDataByViteID(internals, id)) {
				let pageStyles = '';
				for(const [_styleId, styles] of walkStyles(this, id)) {
					pageStyles += styles;
				}

				// Pages with no styles, nothing more to do
				if(!pageStyles) continue;

				const { code: minifiedCSS } = await esbuild.transform(pageStyles, {
					loader: 'css',
					minify: true,
				});
				const referenceId = this.emitFile({
					name: 'entry' + '.css',
					type: 'asset',
					source: minifiedCSS,
				});
				const fileName = this.getFileName(referenceId);

				// Add CSS file to the page's pageData, so that it will be rendered with
				// the correct links.
				getPageDataByViteID(internals, id)?.css.add(fileName);
			}
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
				delete viteCSSPost.renderChunk;
				delete viteCSSPost.generateBundle;

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

		async load(id) {
			if (isPageStyleVirtualModule(id)) {
				return internals.astroPageStyleMap.get(id) || null;
			}
			if (isStyleVirtualModule(id)) {
				return internals.astroStyleMap.get(id) || null;
			}
			return null;
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

		async renderChunk(_code, chunk) {
			if(!legacy) return null;

			let chunkCSS = '';
			let isPureCSS = true;
			for (const [id] of Object.entries(chunk.modules)) {
				if (!isCSSRequest(id) && !isPageStyleVirtualModule(id)) {
					isPureCSS = false;
				}
				if (styleSourceMap.has(id)) {
					chunkCSS += styleSourceMap.get(id)!;
				}
			}

			if (!chunkCSS) return null; // don’t output empty .css files

			if (isPureCSS) {
				internals.pureCSSChunks.add(chunk);
			}

			const { code: minifiedCSS } = await esbuild.transform(chunkCSS, {
				loader: 'css',
				minify: true,
			});
			const referenceId = this.emitFile({
				name: chunk.name + '.css',
				type: 'asset',
				source: minifiedCSS,
			});

			internals.chunkToReferenceIdMap.set(chunk.fileName, referenceId);
			if (chunk.type === 'chunk') {
				const fileName = this.getFileName(referenceId);
				for (const pageData of getPageDatasByChunk(internals, chunk)) {
					pageData.css.add(fileName);
				}
			}

			return null;
		},

		// Delete CSS chunks so JS is not produced for them.
		async generateBundle(opts, bundle) {
			const hasPureCSSChunks = internals.pureCSSChunks.size;
			const pureChunkFilenames = new Set([...internals.pureCSSChunks].map((chunk) => chunk.fileName));
			const emptyChunkFiles = [...pureChunkFilenames]
				.map((file) => path.basename(file))
				.join('|')
				.replace(/\./g, '\\.');
			const emptyChunkRE = new RegExp(opts.format === 'es' ? `\\bimport\\s*"[^"]*(?:${emptyChunkFiles})";\n?` : `\\brequire\\(\\s*"[^"]*(?:${emptyChunkFiles})"\\);\n?`, 'g');

			// Crawl the module graph to find CSS chunks to create
			if(!legacy) {
				await addStyles.call(this);
			}

			for (const [chunkId, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'chunk') {
					// This find shared chunks of CSS and adds them to the main CSS chunks,
					// so that shared CSS is added to the page.
					for (const { css: cssSet } of getPageDatasByChunk(internals, chunk)) {
						for (const imp of chunk.imports) {
							if (internals.chunkToReferenceIdMap.has(imp) && !pureChunkFilenames.has(imp)) {
								const referenceId = internals.chunkToReferenceIdMap.get(imp)!;
								const fileName = this.getFileName(referenceId);
								if (!cssSet.has(fileName)) {
									cssSet.add(fileName);
								}
							}
						}
					}

					// Removes imports for pure CSS chunks.
					if (hasPureCSSChunks) {
						if (internals.pureCSSChunks.has(chunk) && !chunk.exports.length) {
							// Delete pure CSS chunks, these are JavaScript chunks that only import
							// other CSS files, so are empty at the end of bundling.
							delete bundle[chunkId];
						} else {
							// Remove any pure css chunk imports from JavaScript.
							// Note that this code comes from Vite's CSS build plugin.
							chunk.code = chunk.code.replace(
								emptyChunkRE,
								// remove css import while preserving source map location
								(m) => `/* empty css ${''.padEnd(m.length - 15)}*/`
							);
						}
					}
				}
			}
		},
	};
}
