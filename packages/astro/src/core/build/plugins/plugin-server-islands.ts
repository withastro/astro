import { vitePluginServerIslandsBuild } from '../../server-islands/vite-plugin-server-islands.js';
import type { BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin.js';
import type { StaticBuildOptions } from '../types.js';

export function pluginServerIslands(
	opts: StaticBuildOptions,
	internals: BuildInternals,
): AstroBuildPlugin {
	return {
		targets: ['server'],
		hooks: {
			'build:before': () => {
				return {
					vitePlugin: vitePluginServerIslandsBuild(opts, internals),
				};
			},
		},
	};
}
