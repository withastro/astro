import { viteID } from '../core/util.js';
import { getAstroMetadata } from '../vite-plugin-astro/index.js';
import { crawlGraph } from './vite.js';
async function getComponentMetadata(filePath, loader) {
	const map = /* @__PURE__ */ new Map();
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
function addMetadata(map, modInfo) {
	if (modInfo) {
		const astro = getAstroMetadata(modInfo);
		if (astro) {
			let metadata = {
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
export { getComponentMetadata };
