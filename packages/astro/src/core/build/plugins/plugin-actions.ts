import { vitePluginActionsBuild } from '../../../actions/vite-plugin-actions.js';
import type { BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin.js';
import type { StaticBuildOptions } from '../types.js';

export function pluginActions(
	opts: StaticBuildOptions,
	internals: BuildInternals,
): AstroBuildPlugin {
	return {
		targets: ['server'],
		hooks: {
			'build:before': () => {
				return {
					vitePlugin: vitePluginActionsBuild(opts, internals),
				};
			},
		},
	};
}
