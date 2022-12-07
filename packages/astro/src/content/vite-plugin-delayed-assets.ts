import type { Plugin } from 'vite';
import type { ModuleLoader } from '../core/module-loader/loader.js';
import parseImports from 'parse-imports';
import { moduleIsTopLevelPage, walkParentInfos } from '../core/build/graph.js';
import { BuildInternals, getPageDataByViteID } from '../core/build/internal.js';
import { AstroSettings } from '../@types/astro.js';
import { getStylesForURL } from '../core/render/dev/css.js';
import { pathToFileURL } from 'url';
import { createViteLoader } from '../core/module-loader/vite.js';
import {
	contentFileExts,
	DELAYED_ASSET_FLAG,
	LINKS_PLACEHOLDER,
	STYLES_PLACEHOLDER,
	VIRTUAL_MODULE_ID,
} from './consts.js';

function isDelayedAsset(url: URL): boolean {
	return (
		url.searchParams.has(DELAYED_ASSET_FLAG) &&
		contentFileExts.some((ext) => url.pathname.endsWith(ext))
	);
}

export function astroDelayedAssetPlugin({
	mode,
}: {
	mode: string;
}): Plugin {
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
			const url = new URL(id, 'file://');
			if (isDelayedAsset(url)) {
				const code = `
					export { Content, getHeadings, _internal } from ${JSON.stringify(url.pathname)};
					export const collectedLinks = ${JSON.stringify(LINKS_PLACEHOLDER)};
					export const collectedStyles = ${JSON.stringify(STYLES_PLACEHOLDER)};
				`;
				return { code };
			}
		},
		async transform(code, id, options) {
			if (!options?.ssr) return;
			const url = new URL(id, 'file://');
			if (devModuleLoader && isDelayedAsset(url)) {
				const { pathname } = url;
				if (!devModuleLoader.getModuleById(pathname)?.ssrModule) {
					await devModuleLoader.import(pathname);
				}
				const { stylesMap, urls } = await getStylesForURL(
					pathToFileURL(pathname),
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
								const entryDeferredCss = pageData.contentDeferredCss?.get(id);
								if (!entryDeferredCss) continue;
								chunk.code = chunk.code.replace(
									JSON.stringify(LINKS_PLACEHOLDER),
									JSON.stringify([...entryDeferredCss])
								);
							}
						}
					}
				}
			}
		},
	};
}

function getRenderEntryImportName(parseImportRes: Awaited<ReturnType<typeof parseImports>>) {
	for (const imp of parseImportRes) {
		if (imp.moduleSpecifier.value === VIRTUAL_MODULE_ID && imp.importClause?.named) {
			for (const namedImp of imp.importClause.named) {
				if (namedImp.specifier === 'renderEntry') {
					// Use `binding` to support `import { renderEntry as somethingElse }...
					return namedImp.binding;
				}
			}
		}
	}
	return undefined;
}
