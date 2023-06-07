import type { AstroConfig } from 'astro';
import type { Plugin } from 'vite';
import type { PluginContext } from 'rollup';
import { loadMarkdocConfig } from './load-config.js';

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
			let componentPathnameByTag: Record<string, string> = {};
			const { tags = {}, nodes = {} /* TODO: nodes */ } = config;
			for (const [name, value] of Object.entries(tags)) {
				if (value.render instanceof URL) {
					componentPathnameByTag[name] = value.render.pathname;
				}
			}
			let stringifiedComponentImports = '';
			let stringifiedComponentMap = '{';
			for (const [tag, componentPathname] of Object.entries(componentPathnameByTag)) {
				stringifiedComponentImports += `import ${tag} from ${JSON.stringify(
					componentPathname + '?astroPropagatedAssets'
				)};\n`;
				stringifiedComponentMap += `${tag},\n`;
			}
			stringifiedComponentMap += '}';
			const code = `import { resolveComponentImports } from '@astrojs/markdoc/runtime';
										import markdocConfig from ${JSON.stringify(fileUrl.pathname)};
										${stringifiedComponentImports};

										const tagComponentMap = ${stringifiedComponentMap};
										export default resolveComponentImports(markdocConfig, tagComponentMap);`;

			console.log('$$$markdoc-config', code);
			return code;
		},
	};
}
