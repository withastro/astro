import { Plugin } from 'vite';
import { moduleIsTopLevelPage, walkParentInfos } from '../core/build/graph.js';
import { BuildInternals, getPageDataByViteID } from '../core/build/internal.js';

const assetPlaceholder = `'@@ASTRO-ASSET-PLACEHOLDER@@'`;

export const DELAYED_ASSET_FLAG = '?astro-asset-ssr';

export function injectDelayedAssetPlugin(): Plugin {
	return {
		name: 'astro-inject-delayed-asset-plugin',
		enforce: 'post',
		load(id) {
			if (id.endsWith(DELAYED_ASSET_FLAG)) {
				const code = `
					export { Content } from ${JSON.stringify(id.replace(DELAYED_ASSET_FLAG, ''))};
					export const collectedCss = ${assetPlaceholder}
				`;
				return code;
			}
		},
	};
}

export function assetSsrPlugin({ internals }: { internals: BuildInternals }): Plugin {
	return {
		name: 'astro-asset-ssr-plugin',
		async generateBundle(_options, bundle) {
			for (const [_, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'chunk' && chunk.code.includes(assetPlaceholder)) {
					for (const id of Object.keys(chunk.modules)) {
						for (const [pageInfo, depth, order] of walkParentInfos(id, this)) {
							if (moduleIsTopLevelPage(pageInfo)) {
								const pageViteID = pageInfo.id;
								const pageData = getPageDataByViteID(internals, pageViteID);
								if (pageData) {
									chunk.code = chunk.code.replace(
										assetPlaceholder,
										JSON.stringify([...(pageData.delayedCss ?? [])])
									);
								}
							}
						}
					}
				}
			}
		},
	};
}
