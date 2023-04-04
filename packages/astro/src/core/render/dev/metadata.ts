import type { SSRComponentMetadata, SSRResult } from '../../../@types/astro';

import type { ModuleInfo, ModuleLoader } from '../../module-loader/index';

import { getAstroMetadata } from '../../../vite-plugin-astro/index.js';
import { viteID } from '../../util.js';
import { crawlGraph } from './vite.js';

export async function getComponentMetadata(
	filePath: URL,
	loader: ModuleLoader
): Promise<SSRResult['componentMetadata']> {
	const map: SSRResult['componentMetadata'] = new Map();

	const rootID = viteID(filePath);
	addMetadata(map, loader.getModuleInfo(rootID));
	for await (const moduleNode of crawlGraph(loader, rootID, true, false)) {
		const id = moduleNode.id;
		if (id) {
			addMetadata(map, loader.getModuleInfo(id));
		}
	}

	return map;
}

function addMetadata(map: SSRResult['componentMetadata'], modInfo: ModuleInfo | null) {
	if (modInfo) {
		const astro = getAstroMetadata(modInfo);
		if (astro) {
			let metadata: SSRComponentMetadata = {
				containsHead: false,
				propagation: 'none',
			};
			if (astro.propagation) {
				metadata.propagation = astro.propagation;
			}
			if (astro.containsHead) {
				metadata.containsHead = astro.containsHead;
			}
			map.set(modInfo.id, metadata);
		}
	}
}
