import type { AstroConfig } from '../../@types/astro';
import type { Plugin as VitePlugin } from 'vite';
import type { BuildInternals } from '../../core/build/internal.js';
import { viteID } from '../util.js';
import { getPageDataByViteID } from './internal.js';

function virtualHoistedEntry(id: string) {
	return id.endsWith('.astro/hoisted.js') || id.endsWith('.md/hoisted.js');
}

export function vitePluginHoistedScripts(astroConfig: AstroConfig, internals: BuildInternals): VitePlugin {
	return {
		name: '@astro/rollup-plugin-astro-hoisted-scripts',

		resolveId(id) {
			if (virtualHoistedEntry(id)) {
				return id;
			}
		},

		load(id) {
			if (virtualHoistedEntry(id)) {
				let code = '';
				for (let path of internals.hoistedScriptIdToHoistedMap.get(id)!) {
					code += `import "${path}";`;
				}
				return {
					code,
				};
			}
			return void 0;
		},

		async generateBundle(_options, bundle) {
			// Find all page entry points and create a map of the entry point to the hashed hoisted script.
			// This is used when we render so that we can add the script to the head.
			for (const [id, output] of Object.entries(bundle)) {
				if (output.type === 'chunk' && output.facadeModuleId && virtualHoistedEntry(output.facadeModuleId)) {
					const facadeId = output.facadeModuleId!;
					const pathname = facadeId.slice(0, facadeId.length - '/hoisted.js'.length);

					const vid = viteID(new URL('.' + pathname, astroConfig.projectRoot));
					const pageInfo = getPageDataByViteID(internals, vid);
					if(pageInfo) {
						pageInfo.hoistedScript = id;
					}
				}
			}
		},
	};
}
