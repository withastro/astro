import type { ModuleInfo } from 'rollup';
import vite from 'vite';
import type { SSRElement } from '../../../@types/astro';
import type { PluginMetadata as AstroPluginMetadata } from '../../../vite-plugin-astro/types';
import { viteID } from '../../util.js';
import { createModuleScriptElementWithSrc } from '../ssr-element.js';
import { crawlGraph } from './vite.js';

export async function getScriptsForURL(
	filePath: URL,
	viteServer: vite.ViteDevServer
): Promise<Set<SSRElement>> {
	const elements = new Set<SSRElement>();
	const rootID = viteID(filePath);
	const modInfo = viteServer.pluginContainer.getModuleInfo(rootID);
	addHoistedScripts(elements, modInfo);
	for await (const moduleNode of crawlGraph(viteServer, rootID, true)) {
		const id = moduleNode.id;
		if (id) {
			const info = viteServer.pluginContainer.getModuleInfo(id);
			addHoistedScripts(elements, info);
		}
	}

	return elements;
}

function addHoistedScripts(set: Set<SSRElement>, info: ModuleInfo | null) {
	if (!info?.meta?.astro) {
		return;
	}

	let id = info.id;
	const astro = info?.meta?.astro as AstroPluginMetadata['astro'];
	for (let i = 0; i < astro.scripts.length; i++) {
		const scriptId = `${id}?astro&type=script&index=${i}&lang.ts`;
		const element = createModuleScriptElementWithSrc(scriptId);
		set.add(element);
	}
}
