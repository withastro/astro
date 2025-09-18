import type { Plugin as VitePlugin } from 'vite';
import vitePluginRenderers, {
	ASTRO_RENDERERS_MODULE_ID,
} from '../../../vite-plugin-renderers/index.js';
import { addRollupInput } from '../add-rollup-input.js';
import type { AstroBuildPlugin } from '../plugin.js';
import type { StaticBuildOptions } from '../types.js';

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
