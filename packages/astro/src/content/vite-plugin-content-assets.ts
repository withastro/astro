import { pathToFileURL } from 'url';
import type { Plugin } from 'vite';
import { moduleIsTopLevelPage, walkParentInfos } from '../core/build/graph.js';
import { BuildInternals, getPageDataByViteID } from '../core/build/internal.js';
import type { ModuleLoader } from '../core/module-loader/loader.js';
import { createViteLoader } from '../core/module-loader/vite.js';
import { getStylesForURL } from '../core/render/dev/css.js';
import {
	contentFileExts,
	DELAYED_ASSET_FLAG,
	LINKS_PLACEHOLDER,
	STYLES_PLACEHOLDER,
} from './consts.js';

function isDelayedAsset(viteId: string): boolean {
	const url = new URL(viteId, 'file://');
	return (
		url.searchParams.has(DELAYED_ASSET_FLAG) &&
		contentFileExts.some((ext) => url.pathname.endsWith(ext))
	);
}

export function astroDelayedAssetPlugin({ mode }: { mode: string }): Plugin {
	let devModuleLoader: ModuleLoader;
	return {
		name: 'astro-delayed-asset-plugin',
		enforce: 'pre',
		configureServer(server) {
			if (mode === 'dev') {
				devModuleLoader = createViteLoader(server);
			}
		},
		load(id) {
			if (isDelayedAsset(id)) {
				const basePath = id.split('?')[0];
				const code = `
					export { Content, getHeadings, _internal } from ${JSON.stringify(basePath)};
					export const collectedLinks = ${JSON.stringify(LINKS_PLACEHOLDER)};
					export const collectedStyles = ${JSON.stringify(STYLES_PLACEHOLDER)};
				`;
				return { code };
			}
		},
		async transform(code, id, options) {
			if (!options?.ssr) return;
			if (devModuleLoader && isDelayedAsset(id)) {
				const basePath = id.split('?')[0];
				if (!devModuleLoader.getModuleById(basePath)?.ssrModule) {
					await devModuleLoader.import(basePath);
				}
				const { stylesMap, urls } = await getStylesForURL(
					pathToFileURL(basePath),
					devModuleLoader,
					'development'
				);

				return {
					code: code
						.replace(JSON.stringify(LINKS_PLACEHOLDER), JSON.stringify([...urls]))
						.replace(JSON.stringify(STYLES_PLACEHOLDER), JSON.stringify([...stylesMap.values()])),
				};
			}
		},
	};
}

export function astroBundleDelayedAssetPlugin({
	internals,
}: {
	internals: BuildInternals;
}): Plugin {
	return {
		name: 'astro-bundle-delayed-asset-plugin',
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
