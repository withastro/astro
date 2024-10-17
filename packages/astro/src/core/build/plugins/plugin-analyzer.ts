import type { PluginContext } from 'rollup';
import type { Plugin as VitePlugin } from 'vite';
import type { PluginMetadata as AstroPluginMetadata } from '../../../vite-plugin-astro/types.js';
import type { BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin.js';

import { PROPAGATED_ASSET_FLAG } from '../../../content/consts.js';
import { prependForwardSlash } from '../../../core/path.js';
import {
	getParentModuleInfos,
	getTopLevelPageModuleInfos,
	moduleIsTopLevelPage,
} from '../graph.js';
import {
	getPageDataByViteID,
	trackClientOnlyPageDatas,
	trackScriptPageDatas,
} from '../internal.js';
import type { StaticBuildOptions } from '../types.js';

function isPropagatedAsset(id: string) {
	try {
		return new URL('file://' + id).searchParams.has(PROPAGATED_ASSET_FLAG);
	} catch {
		return false;
	}
}

export function vitePluginAnalyzer(
	options: StaticBuildOptions,
	internals: BuildInternals,
): VitePlugin {
	function hoistedScriptScanner() {
		const uniqueHoistedIds = new Map<string, string>();
		const pageScriptsMap = new Map<
			string,
			{
				hoistedSet: Set<string>;
			}
		>();

		return {
			async scan(
				this: PluginContext,
				scripts: AstroPluginMetadata['astro']['scripts'],
				from: string,
			) {
				const hoistedScripts = new Set<string>();
				for (let i = 0; i < scripts.length; i++) {
					const hid = `${from.replace('/@fs', '')}?astro&type=script&index=${i}&lang.ts`;
					hoistedScripts.add(hid);
				}

				if (hoistedScripts.size) {
					for (const parentInfo of getParentModuleInfos(from, this, isPropagatedAsset)) {
						if (isPropagatedAsset(parentInfo.id)) {
							if (!internals.propagatedScriptsMap.has(parentInfo.id)) {
								internals.propagatedScriptsMap.set(parentInfo.id, new Set());
							}
							const propagatedScripts = internals.propagatedScriptsMap.get(parentInfo.id)!;
							for (const hid of hoistedScripts) {
								propagatedScripts.add(hid);
							}
						} else if (moduleIsTopLevelPage(parentInfo)) {
							if (!pageScriptsMap.has(parentInfo.id)) {
								pageScriptsMap.set(parentInfo.id, {
									hoistedSet: new Set(),
								});
							}
							const pageScripts = pageScriptsMap.get(parentInfo.id)!;
							for (const hid of hoistedScripts) {
								pageScripts.hoistedSet.add(hid);
							}
						}
					}
				}
			},

			finalize() {
				// Add propagated scripts to client build,
				// but DON'T add to pages -> hoisted script map.
				for (const propagatedScripts of internals.propagatedScriptsMap.values()) {
					for (const propagatedScript of propagatedScripts) {
						internals.discoveredScripts.add(propagatedScript);
					}
				}

				for (const [pageId, { hoistedSet }] of pageScriptsMap) {
					const pageData = getPageDataByViteID(internals, pageId);
					if (!pageData) continue;

					const { component } = pageData;
					const astroModuleId = prependForwardSlash(component);

					const uniqueHoistedId = JSON.stringify(Array.from(hoistedSet).sort());
					let moduleId: string;

					// If we're already tracking this set of hoisted scripts, get the unique id
					if (uniqueHoistedIds.has(uniqueHoistedId)) {
						moduleId = uniqueHoistedIds.get(uniqueHoistedId)!;
					} else {
						// Otherwise, create a unique id for this set of hoisted scripts
						moduleId = `/astro/hoisted.js?q=${uniqueHoistedIds.size}`;
						uniqueHoistedIds.set(uniqueHoistedId, moduleId);
					}
					internals.discoveredScripts.add(moduleId);

					// Make sure to track that this page uses this set of hoisted scripts
					if (internals.hoistedScriptIdToPagesMap.has(moduleId)) {
						const pages = internals.hoistedScriptIdToPagesMap.get(moduleId);
						pages!.add(astroModuleId);
					} else {
						internals.hoistedScriptIdToPagesMap.set(moduleId, new Set([astroModuleId]));
						internals.hoistedScriptIdToHoistedMap.set(moduleId, hoistedSet);
					}
				}
			},
		};
	}

	return {
		name: '@astro/rollup-plugin-astro-analyzer',
		async generateBundle() {
			const hoistScanner = options.settings.config.experimental.directRenderScript
				? { scan: async () => {}, finalize: () => {} }
				: hoistedScriptScanner();

			const ids = this.getModuleIds();

			for (const id of ids) {
				const info = this.getModuleInfo(id);
				if (!info?.meta?.astro) continue;

				const astro = info.meta.astro as AstroPluginMetadata['astro'];

				for (const c of astro.hydratedComponents) {
					const rid = c.resolvedPath ? decodeURI(c.resolvedPath) : c.specifier;
					if (internals.discoveredHydratedComponents.has(rid)) {
						const exportNames = internals.discoveredHydratedComponents.get(rid);
						exportNames?.push(c.exportName);
					} else {
						internals.discoveredHydratedComponents.set(rid, [c.exportName]);
					}
				}

				// Scan hoisted scripts
				await hoistScanner.scan.call(this, astro.scripts, id);

				if (astro.clientOnlyComponents.length) {
					const clientOnlys: string[] = [];

					for (const c of astro.clientOnlyComponents) {
						const cid = c.resolvedPath ? decodeURI(c.resolvedPath) : c.specifier;
						if (internals.discoveredClientOnlyComponents.has(cid)) {
							const exportNames = internals.discoveredClientOnlyComponents.get(cid);
							exportNames?.push(c.exportName);
						} else {
							internals.discoveredClientOnlyComponents.set(cid, [c.exportName]);
						}
						clientOnlys.push(cid);

						const resolvedId = await this.resolve(c.specifier, id);
						if (resolvedId) {
							clientOnlys.push(resolvedId.id);
						}
					}

					for (const pageInfo of getTopLevelPageModuleInfos(id, this)) {
						const newPageData = getPageDataByViteID(internals, pageInfo.id);
						if (!newPageData) continue;

						trackClientOnlyPageDatas(internals, newPageData, clientOnlys);
					}
				}

				// When directly rendering scripts, we don't need to group them together when bundling,
				// each script module is its own entrypoint, so we directly assign each script modules to
				// `discoveredScripts` here, which will eventually be passed as inputs of the client build.
				if (options.settings.config.experimental.directRenderScript && astro.scripts.length) {
					const scriptIds = astro.scripts.map(
						(_, i) => `${id.replace('/@fs', '')}?astro&type=script&index=${i}&lang.ts`,
					);

					// Assign as entrypoints for the client bundle
					for (const scriptId of scriptIds) {
						internals.discoveredScripts.add(scriptId);
					}

					// The script may import CSS, so we also have to track the pages that use this script
					for (const pageInfo of getTopLevelPageModuleInfos(id, this)) {
						const newPageData = getPageDataByViteID(internals, pageInfo.id);
						if (!newPageData) continue;

						trackScriptPageDatas(internals, newPageData, scriptIds);
					}
				}
			}

			// Finalize hoisting
			hoistScanner.finalize();
		},
	};
}

export function pluginAnalyzer(
	options: StaticBuildOptions,
	internals: BuildInternals,
): AstroBuildPlugin {
	return {
		targets: ['server'],
		hooks: {
			'build:before': () => {
				return {
					vitePlugin: vitePluginAnalyzer(options, internals),
				};
			},
		},
	};
}
