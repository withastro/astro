import type { SSRResult } from '../../../@types/astro';

import type { ModuleInfo, ModuleLoader } from '../../module-loader/index';

import { viteID } from '../../util.js';
import { getAstroMetadata } from '../../../vite-plugin-astro/index.js';
import { crawlGraph } from './vite.js';

export async function getPropagationMap(
	filePath: URL,
	loader: ModuleLoader
): Promise<SSRResult['propagation']> {
	const map: SSRResult['propagation'] = new Map();

	const rootID = viteID(filePath);
	addInjection(map, loader.getModuleInfo(rootID))
	for await (const moduleNode of crawlGraph(loader, rootID, true)) {
		const id = moduleNode.id;
		if (id) {
			addInjection(map, loader.getModuleInfo(id));
		}
	}

	return map;
}

function addInjection(map: SSRResult['propagation'], modInfo: ModuleInfo | null) {
	if(modInfo) {
		const astro = getAstroMetadata(modInfo);
		if(astro && astro.headInjection) {
			map.set(modInfo.id, astro.headInjection)
		}
	}
}
