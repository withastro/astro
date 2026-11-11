import type { ModuleInfo, ModuleLoader } from '../internal/core/module-loader/index.js';
import { viteID } from '@astrojs/vite-plugin-astro/_internal/core/vite-id.js';
import type { SSRComponentMetadata, SSRResult } from '@astrojs/vite-plugin-astro';
import { getAstroMetadata } from '@astrojs/vite-plugin-astro/_internal/vite-plugin-astro/index.js';
import { crawlGraph } from '../internal/vite-plugin-astro-server/vite.js';

export async function getComponentMetadata(
	filePath: URL,
	loader: ModuleLoader,
): Promise<SSRResult['componentMetadata']> {
	const map: SSRResult['componentMetadata'] = new Map();

	const rootID = viteID(filePath);
	addMetadata(map, loader.getModuleInfo(rootID));
	for await (const moduleNode of crawlGraph(loader.getSSREnvironment(), rootID, true)) {
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
