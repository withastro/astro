import type { AstroConfig } from 'astro';
import type { Plugin } from 'vite';
import type { PluginContext } from 'rollup';
import { loadMarkdocConfig } from './load-config.js';
import type { Schema, Config as MarkdocConfig } from '@markdoc/markdoc';
import type { Render } from './config.js';
import { setupConfig } from './runtime.js';

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
			// Only add `astro/assets` import when `experimental.assets` is enabled. Would throw without this check!
			const injectAssetsConfig = astroConfig.experimental.assets;

			if (!markdocConfigResult) {
				return `${
					injectAssetsConfig
						? `import { experimentalAssetsConfig } from '@astrojs/markdoc/experimental-assets-config';\n`
						: ''
				}export async function getConfig(configOverrides = {}) { return ${
					injectAssetsConfig
						? '{ ...experimentalAssetsConfig, ...configOverrides }'
						: 'configOverrides'
				} }
				export function getConfigSync() { return ${
					injectAssetsConfig ? 'experimentalAssetsConfig' : '{}'
				} }`;
			}
			const { config: unresolvedConfig, fileUrl } = markdocConfigResult;
			const config = await setupConfig(unresolvedConfig);
			const tagRenderPathnameMap = getRenderUrlMap(config.tags ?? {});
			const nodeRenderPathnameMap = getRenderUrlMap(config.nodes ?? {});

			const code = `import { setupConfig, setupConfigSync, resolveComponentImports } from '@astrojs/markdoc/runtime';
			import userConfig from ${JSON.stringify(fileUrl.pathname)};${
				astroConfig.experimental.assets
					? `\nimport { experimentalAssetsConfig } from '@astrojs/markdoc/experimental-assets-config';\nuserConfig.nodes = { ...experimentalAssetsConfig.nodes, ...userConfig.nodes };`
					: ''
			}
			${getStringifiedImports(tagRenderPathnameMap, 'Tag')};
			${getStringifiedImports(nodeRenderPathnameMap, 'Node')};

			const tagComponentMap = ${getStringifiedMap(tagRenderPathnameMap, 'Tag')};
			const nodeComponentMap = ${getStringifiedMap(nodeRenderPathnameMap, 'Node')};

			export async function getConfig(configOverrides = {}) {
				const config = await setupConfig(userConfig, configOverrides);
				return resolveComponentImports(config, tagComponentMap, nodeComponentMap);
			}
			
			${/* used by `getHeadings()`. This bypasses `extends` resolution, which can be async */ ''}
			export function getConfigSync() {
				return setupConfigSync(userConfig);
			}`;
			return code;
		},
	};
}

function getRenderUrlMap(tagsOrNodes: Record<string, Schema<MarkdocConfig, Render>>) {
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
