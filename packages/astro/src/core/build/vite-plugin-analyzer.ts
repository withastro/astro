import type { PluginContext } from 'rollup';
import type { Plugin as VitePlugin } from 'vite';
import type { AstroConfig } from '../../@types/astro';
import type { BuildInternals } from '../../core/build/internal.js';
import type { PluginMetadata as AstroPluginMetadata } from '../../vite-plugin-astro/types';

import { prependForwardSlash } from '../../core/path.js';
import { getTopLevelPages } from './graph.js';
import { getPageDataByViteID, trackClientOnlyPageDatas } from './internal.js';

export function vitePluginAnalyzer(
	astroConfig: AstroConfig,
	internals: BuildInternals
): VitePlugin {
	function hoistedScriptScanner() {
		const uniqueHoistedIds = new Map<string, string>();
		const pageScripts = new Map<string, Set<string>>();

		return {
			scan(this: PluginContext, scripts: AstroPluginMetadata['astro']['scripts'], from: string) {
				const hoistedScripts = new Set<string>();
				for (let i = 0; i < scripts.length; i++) {
					const hid = `${from.replace('/@fs', '')}?astro&type=script&index=${i}`;
					hoistedScripts.add(hid);
				}

				if (hoistedScripts.size) {
					for (const pageId of getTopLevelPages(from, this)) {
						for (const hid of hoistedScripts) {
							if (pageScripts.has(pageId)) {
								pageScripts.get(pageId)?.add(hid);
							} else {
								pageScripts.set(pageId, new Set([hid]));
							}
						}
					}
				}
			},

			finalize() {
				for (const [pageId, hoistedScripts] of pageScripts) {
					const pageData = getPageDataByViteID(internals, pageId);
					if (!pageData) continue;

					const { component } = pageData;
					const astroModuleId = prependForwardSlash(component);

					const uniqueHoistedId = JSON.stringify(Array.from(hoistedScripts).sort());
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
						internals.hoistedScriptIdToHoistedMap.set(moduleId, hoistedScripts);
					}
				}
			},
		};
	}

	return {
		name: '@astro/rollup-plugin-astro-analyzer',
		generateBundle() {
			const hoistScanner = hoistedScriptScanner();

			const ids = this.getModuleIds();
			for (const id of ids) {
				const info = this.getModuleInfo(id);
				if (!info || !info.meta?.astro) continue;

				const astro = info.meta.astro as AstroPluginMetadata['astro'];

				for (const c of astro.hydratedComponents) {
					internals.discoveredHydratedComponents.add(c.resolvedPath || c.specifier);
				}

				// Scan hoisted scripts
				hoistScanner.scan.call(this, astro.scripts, id);

				if (astro.clientOnlyComponents.length) {
					const clientOnlys: string[] = [];

					for (const c of astro.clientOnlyComponents) {
						const cid = c.resolvedPath || c.specifier;
						internals.discoveredClientOnlyComponents.add(cid);
						clientOnlys.push(cid);
					}

					for (const pageId of getTopLevelPages(id, this)) {
						const pageData = getPageDataByViteID(internals, pageId);
						if (!pageData) continue;

						trackClientOnlyPageDatas(internals, pageData, clientOnlys);
					}
				}
			}

			// Finalize hoisting
			hoistScanner.finalize();
		},
	};
}
