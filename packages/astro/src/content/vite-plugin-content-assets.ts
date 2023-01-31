import { pathToFileURL } from 'url';
import type { Plugin } from 'vite';
import { moduleIsTopLevelPage, walkParentInfos } from '../core/build/graph.js';
import { BuildInternals, getPageDataByViteID } from '../core/build/internal.js';
import type { ModuleLoader } from '../core/module-loader/loader.js';
import { createViteLoader } from '../core/module-loader/vite.js';
import { getStylesForURL } from '../core/render/dev/css.js';
import { getScriptsForURL } from '../core/render/dev/scripts.js';
import {
	contentFileExts,
	LINKS_PLACEHOLDER,
	PROPAGATED_ASSET_FLAG,
	SCRIPTS_PLACEHOLDER,
	STYLES_PLACEHOLDER,
} from './consts.js';

function isPropagatedAsset(viteId: string): boolean {
	const url = new URL(viteId, 'file://');
	return (
		url.searchParams.has(PROPAGATED_ASSET_FLAG) &&
		contentFileExts.some((ext) => url.pathname.endsWith(ext))
	);
}

export function astroContentAssetPropagationPlugin({ mode }: { mode: string }): Plugin {
	let devModuleLoader: ModuleLoader;
	return {
		name: 'astro:content-asset-propagation',
		enforce: 'pre',
		configureServer(server) {
			if (mode === 'dev') {
				devModuleLoader = createViteLoader(server);
			}
		},
		load(id) {
			if (isPropagatedAsset(id)) {
				const basePath = id.split('?')[0];
				const code = `
					export { Content, getHeadings, frontmatter } from ${JSON.stringify(basePath)};
					export const collectedLinks = ${JSON.stringify(LINKS_PLACEHOLDER)};
					export const collectedStyles = ${JSON.stringify(STYLES_PLACEHOLDER)};
					export const collectedScripts = ${JSON.stringify(SCRIPTS_PLACEHOLDER)};
				`;
				return { code };
			}
		},
		async transform(code, id, options) {
			if (!options?.ssr) return;
			if (devModuleLoader && isPropagatedAsset(id)) {
				const basePath = id.split('?')[0];
				if (!devModuleLoader.getModuleById(basePath)?.ssrModule) {
					await devModuleLoader.import(basePath);
				}
				const { stylesMap, urls } = await getStylesForURL(
					pathToFileURL(basePath),
					devModuleLoader,
					'development'
				);

				const hoistedScripts = await getScriptsForURL(pathToFileURL(basePath), devModuleLoader);

				return {
					code: code
						.replace(JSON.stringify(LINKS_PLACEHOLDER), JSON.stringify([...urls]))
						.replace(JSON.stringify(STYLES_PLACEHOLDER), JSON.stringify([...stylesMap.values()]))
						.replace(JSON.stringify(SCRIPTS_PLACEHOLDER), JSON.stringify([...hoistedScripts])),
				};
			}
		},
	};
}

export function astroContentProdBundlePlugin({ internals }: { internals: BuildInternals }): Plugin {
	return {
		name: 'astro:content-prod-bundle',
		async generateBundle(_options, bundle) {
			for (const [_, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'chunk' && chunk.code.includes(LINKS_PLACEHOLDER)) {
					for (const id of Object.keys(chunk.modules)) {
						for (const [pageInfo, depth, order] of walkParentInfos(id, this)) {
							if (moduleIsTopLevelPage(pageInfo)) {
								const pageViteID = pageInfo.id;
								const pageData = getPageDataByViteID(internals, pageViteID);
								if (!pageData) continue;
								const entryCss = pageData.contentCollectionCss?.get(id);
								if (!entryCss) continue;
								chunk.code = chunk.code.replace(
									JSON.stringify(LINKS_PLACEHOLDER),
									JSON.stringify([...entryCss])
								);
							}
						}
					}
				}
			}
		},
	};
}
