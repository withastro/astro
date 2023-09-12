import type { SSRElement } from '../@types/astro.js';
import type { ModuleInfo, ModuleLoader } from '../core/module-loader/index.js';
import { createModuleScriptElementWithSrc } from '../core/render/ssr-element.js';
import { rootRelativePath, viteID } from '../core/util.js';
import type { PluginMetadata as AstroPluginMetadata } from '../vite-plugin-astro/types.js';
import { crawlGraph } from './vite.js';

export async function getScriptsForURL(
	filePath: URL,
	root: URL,
	loader: ModuleLoader
): Promise<Set<SSRElement>> {
	const elements = new Set<SSRElement>();
	const rootID = viteID(filePath);
	const modInfo = loader.getModuleInfo(rootID);
	addHoistedScripts(elements, modInfo, root);
	for await (const moduleNode of crawlGraph(loader, rootID, true)) {
		const id = moduleNode.id;
		if (id) {
			const info = loader.getModuleInfo(id);
			addHoistedScripts(elements, info, root);
		}
	}

	return elements;
}

function addHoistedScripts(set: Set<SSRElement>, info: ModuleInfo | null, root: URL) {
	if (!info?.meta?.astro) {
		return;
	}

	let id = info.id;
	const astro = info?.meta?.astro as AstroPluginMetadata['astro'];
	for (let i = 0; i < astro.scripts.length; i++) {
		let scriptId = `${id}?astro&type=script&index=${i}&lang.ts`;
		scriptId = rootRelativePath(root, scriptId);
		const element = createModuleScriptElementWithSrc(scriptId);
		set.add(element);
	}
}
