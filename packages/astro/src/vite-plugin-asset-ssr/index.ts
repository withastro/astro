import { Plugin } from 'vite';
import { moduleIsTopLevelPage, walkParentInfos } from '../core/build/graph.js';
import { BuildInternals, getPageDataByViteID } from '../core/build/internal.js';
import MagicString from 'magic-string';
import ancestor from 'common-ancestor-path';
import parseImports from 'parse-imports';
import { AstroSettings } from '../@types/astro.js';

const assetPlaceholder = `'@@ASTRO-ASSET-PLACEHOLDER@@'`;

export const DELAYED_ASSET_FLAG = '?astro-asset-ssr';

function getRenderContentImportName(parseImportRes: Awaited<ReturnType<typeof parseImports>>) {
	for (const imp of parseImportRes) {
		if (imp.moduleSpecifier.value === '.astro/render') {
			for (const namedImp of imp.importClause?.named ?? []) {
				if (namedImp.specifier === 'renderContent') {
					// Use `binding` to support `import { renderContent as somethingElse }...
					return namedImp.binding;
				}
			}
		}
	}
}

export function injectDelayedAssetPlugin({ settings }: { settings: AstroSettings }): Plugin {
	// copied from page-ssr.ts
	function normalizeFilename(filename: string) {
		if (filename.startsWith('/@fs')) {
			filename = filename.slice('/@fs'.length);
		} else if (filename.startsWith('/') && !ancestor(filename, settings.config.root.pathname)) {
			filename = new URL('.' + filename, settings.config.root).pathname;
		}
		return filename;
	}

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
				const filename = normalizeFilename(id);

				let renderContentImportName = getRenderContentImportName(await parseImports(code));
				if (!renderContentImportName) return;

				const s = new MagicString(code, { filename });
				s.prepend(`import { renderContent as $$renderContent } from '.astro/render';\n`);
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
