import type { Plugin } from 'vite';
import type { ModuleLoader } from '../core/module-loader/loader.js';
import MagicString from 'magic-string';
import parseImports from 'parse-imports';
import { moduleIsTopLevelPage, walkParentInfos } from '../core/build/graph.js';
import { BuildInternals, getPageDataByViteID } from '../core/build/internal.js';
import { AstroSettings } from '../@types/astro.js';
import { normalizeFilename } from '../vite-plugin-utils/index.js';
import { getStylesForURL } from '../core/render/dev/css.js';
import { pathToFileURL } from 'url';
import { createViteLoader } from '../core/module-loader/vite.js';

const LINKS_PLACEHOLDER = `[/* @@ASTRO-LINKS-PLACEHOLDER@@ */]`;
const STYLES_PLACEHOLDER = `[/* @@ASTRO-STYLES-PLACEHOLDER@@ */]`;

export const DELAYED_ASSET_FLAG = '?astroAssetSsr';

export function astroDelayedAssetPlugin({
	settings,
	mode,
}: {
	settings: AstroSettings;
	mode: string;
}): Plugin {
	let devModuleLoader: ModuleLoader;
	return {
		name: 'astro-delayed-asset-plugin',
		enforce: 'post',
		configureServer(server) {
			if (mode === 'dev') {
				devModuleLoader = createViteLoader(server);
			}
		},
		load(id) {
			if (id.endsWith(DELAYED_ASSET_FLAG)) {
				const code = `
					export { Content } from ${JSON.stringify(id.replace(DELAYED_ASSET_FLAG, ''))};
					export const collectedLinks = ${LINKS_PLACEHOLDER};
					export const collectedStyles = ${STYLES_PLACEHOLDER};
				`;
				return code;
			}
		},
		async transform(code, id, options) {
			if (!options?.ssr) return;
			if (id.endsWith(DELAYED_ASSET_FLAG) && devModuleLoader) {
				const baseId = id.replace(DELAYED_ASSET_FLAG, '');
				if (!devModuleLoader.getModuleById(baseId)?.ssrModule) {
					await devModuleLoader.import(baseId);
				}
				const { stylesMap, urls } = await getStylesForURL(
					pathToFileURL(baseId),
					devModuleLoader,
					'development'
				);

				return {
					code: code
						.replace(LINKS_PLACEHOLDER, JSON.stringify([...urls]))
						.replace(STYLES_PLACEHOLDER, JSON.stringify([...stylesMap.values()])),
				};
			}

			if (id.endsWith('.astro')) {
				let renderContentImportName = getRenderContentImportName(
					await parseImports(escapeViteEnvReferences(code))
				);
				if (!renderContentImportName) return;

				const s = new MagicString(code, {
					filename: normalizeFilename({ fileName: id, projectRoot: settings.config.root }),
				});
				s.prepend(`import { renderContent as $$renderContent } from '.astro';\n`);
				// TODO: not this
				const frontmatterPreamble = '$$createComponent(async ($$result, $$props, $$slots) => {';
				const indexOfFrontmatterPreamble = code.indexOf(frontmatterPreamble);

				if (indexOfFrontmatterPreamble < 0) return;

				s.appendLeft(
					indexOfFrontmatterPreamble + frontmatterPreamble.length,
					`\nlet ${renderContentImportName} = $$renderContent.bind($$result);\n`
				);

				return {
					code: s.toString(),
					map: s.generateMap(),
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
									LINKS_PLACEHOLDER,
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

function getRenderContentImportName(parseImportRes: Awaited<ReturnType<typeof parseImports>>) {
	for (const imp of parseImportRes) {
		if (imp.moduleSpecifier.value === '.astro' && imp.importClause?.named) {
			for (const namedImp of imp.importClause.named) {
				if (namedImp.specifier === 'renderContent') {
					// Use `binding` to support `import { renderContent as somethingElse }...
					return namedImp.binding;
				}
			}
		}
	}
	return undefined;
}

// Necessary to avoid checking `import.meta` during import crawl
function escapeViteEnvReferences(code: string) {
	return code.replace(/import\.meta/g, 'import\\u002Emeta');
}
