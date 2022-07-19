import type { ModuleInfo } from 'rollup';
import slash from 'slash';
import { fileURLToPath } from 'url';
import vite from 'vite';
import type { AstroConfig, SSRElement } from '../../../@types/astro';
import type { PluginMetadata as AstroPluginMetadata } from '../../../vite-plugin-astro/types';
import { viteID } from '../../util.js';
import { createModuleScriptElementWithSrc } from '../ssr-element.js';
import { crawlGraph } from './vite.js';

export async function getScriptsForURL(
	filePath: URL,
	astroConfig: AstroConfig,
	viteServer: vite.ViteDevServer
): Promise<{ scripts: Set<SSRElement>, defineVars: Set<string> }> {
	const elements = new Set<SSRElement>();
	const defineVars = new Set<string>();
	const rootID = viteID(filePath);
	let rootProjectFolder = slash(fileURLToPath(astroConfig.root));
	const modInfo = viteServer.pluginContainer.getModuleInfo(rootID);
	addHoistedScripts(elements, defineVars, modInfo, rootProjectFolder);
	for await (const moduleNode of crawlGraph(viteServer, rootID, true)) {
		const id = moduleNode.id;
		if (id) {
			const info = viteServer.pluginContainer.getModuleInfo(id);
			addHoistedScripts(elements, defineVars, info, rootProjectFolder);
		}
	}

	return { scripts: elements, defineVars };
}

function addHoistedScripts(
	elements: Set<SSRElement>,
	defineVars: Set<string>,
	info: ModuleInfo | null,
	rootProjectFolder: string
) {
	if (!info?.meta?.astro) {
		return;
	}

	let id = info.id;
	const astro = info?.meta?.astro as AstroPluginMetadata['astro'];
	for (let i = 0; i < astro.scripts.length; i++) {
		const scriptId = `${id}?astro&type=script&index=${i}&lang.ts`;
		const script = astro.scripts[i];
		if (script.type === 'define:vars') {
			defineVars.add(`/@fs${scriptId.replace('/@fs', '')}`);
		} else {
			const element = createModuleScriptElementWithSrc(scriptId);
			elements.add(element);
		}
	}
}
