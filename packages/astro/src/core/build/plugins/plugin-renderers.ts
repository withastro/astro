import type { Plugin as VitePlugin } from 'vite';
import vitePluginRenderers, { ASTRO_RENDERERS_MODULE_ID } from '../../../vite-plugin-renderers/index.js';
import { addRollupInput } from '../add-rollup-input.js';
import type { AstroBuildPlugin } from '../plugin.js';
import type { StaticBuildOptions } from '../types.js';

// Keep the old export for backwards compatibility, but it now points to the new module ID
export const RENDERERS_MODULE_ID = ASTRO_RENDERERS_MODULE_ID;
export const RESOLVED_RENDERERS_MODULE_ID = `\0${RENDERERS_MODULE_ID}`;

function vitePluginRenderersForBuild(opts: StaticBuildOptions): VitePlugin {
	const basePlugin = vitePluginRenderers({ settings: opts.settings });
	
	// Add the rollup input option for build
	return {
		...basePlugin,
		options(options) {
			return addRollupInput(options, [ASTRO_RENDERERS_MODULE_ID]);
		},
	};
}

export function pluginRenderers(opts: StaticBuildOptions): AstroBuildPlugin {
	return {
		targets: ['server'],
		hooks: {
			'build:before': () => {
				return {
					vitePlugin: vitePluginRenderersForBuild(opts),
				};
			},
		},
	};
}
