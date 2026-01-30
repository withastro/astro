import { vitePluginMiddlewareBuild } from '../../middleware/vite-plugin.js';
import type { BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin.js';
import type { StaticBuildOptions } from '../types.js';

export function pluginMiddleware(
	opts: StaticBuildOptions,
	internals: BuildInternals,
): AstroBuildPlugin {
	return {
		targets: ['server'],
		hooks: {
			'build:before': () => {
				return {
					vitePlugin: vitePluginMiddlewareBuild(opts, internals),
				};
			},
		},
	};
}
