import { Plugin } from 'vite';
import { moduleIsTopLevelPage, walkParentInfos } from '../core/build/graph.js';
import { BuildInternals, getPageDataByViteID } from '../core/build/internal.js';
import MagicString from 'magic-string';
import parseImports from 'parse-imports';
import { AstroSettings } from '../@types/astro.js';
import { normalizeFilename } from '../vite-plugin-utils/index.js';

const assetPlaceholder = `'@@ASTRO-ASSET-PLACEHOLDER@@'`;

export const DELAYED_ASSET_FLAG = '?astro-asset-ssr';

export function injectDelayedAssetPlugin({ settings }: { settings: AstroSettings }): Plugin {
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
		async transform(code, id, options) {
			if (options?.ssr && id.endsWith('.astro')) {
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
								if (!pageData) continue;
								const entryDeferredCss = pageData.contentDeferredCss?.get(id);
								if (!entryDeferredCss) continue;
								chunk.code = chunk.code.replace(
									assetPlaceholder,
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
