import type { AstroConfig } from 'astro';
import type { Plugin } from 'vite';
import type { PluginContext } from 'rollup';
import { loadMarkdocConfig } from './load-config.js';
import type { AstroMarkdocConfig } from './config.js';
import type { Schema } from '@markdoc/markdoc';
import type { Render } from './config.js';

export const markdocConfigId = 'astro:markdoc-config';
export const resolvedMarkdocConfigId = '\x00' + markdocConfigId;

export function vitePluginMarkdocConfig({ astroConfig }: { astroConfig: AstroConfig }): Plugin {
	return {
		name: '@astrojs/markdoc:config',
		resolveId(this: PluginContext, id: string) {
			if (id === markdocConfigId) {
				return resolvedMarkdocConfigId;
			}
		},
		async load(id: string) {
			if (id !== resolvedMarkdocConfigId) return;

			// TODO: invalidate on change
			const markdocConfigResult = await loadMarkdocConfig(astroConfig);

			if (!markdocConfigResult) {
				return `export default {}`;
			}
			const { config, fileUrl } = markdocConfigResult;
			const tagRenderPathnameMap = getRenderUrlMap(config.tags ?? {});
			const nodeRenderPathnameMap = getRenderUrlMap(config.nodes ?? {});

			const code = `import { resolveComponentImports } from '@astrojs/markdoc/runtime';
			import markdocConfig from ${JSON.stringify(fileUrl.pathname)};
			${getStringifiedImports(tagRenderPathnameMap, 'Tag')};
			${getStringifiedImports(nodeRenderPathnameMap, 'Node')};

			const tagComponentMap = ${getStringifiedMap(tagRenderPathnameMap, 'Tag')};
			const nodeComponentMap = ${getStringifiedMap(nodeRenderPathnameMap, 'Node')};
			export default resolveComponentImports(markdocConfig, tagComponentMap, nodeComponentMap);`;

			console.log('$$$markdoc-config', code);
			return code;
		},
	};
}

function getRenderUrlMap(tagsOrNodes: Record<string, Schema<AstroMarkdocConfig, Render>>) {
	const renderPathnameMap: Record<string, string> = {};
	for (const [name, value] of Object.entries(tagsOrNodes)) {
		if (value.render instanceof URL) {
			renderPathnameMap[name] = value.render.pathname;
		}
	}
	return renderPathnameMap;
}

function getStringifiedImports(renderUrlMap: Record<string, string>, componentNamePrefix: string) {
	let stringifiedComponentImports = '';
	for (const [key, renderUrl] of Object.entries(renderUrlMap)) {
		stringifiedComponentImports += `import ${componentNamePrefix + key} from ${JSON.stringify(
			renderUrl + '?astroPropagatedAssets'
		)};\n`;
	}
	return stringifiedComponentImports;
}

function getStringifiedMap(renderUrlMap: Record<string, string>, componentNamePrefix: string) {
	let stringifiedComponentMap = '{';
	for (const key in renderUrlMap) {
		stringifiedComponentMap += `${key}: ${componentNamePrefix + key},\n`;
	}
	stringifiedComponentMap += '}';
	return stringifiedComponentMap;
}
