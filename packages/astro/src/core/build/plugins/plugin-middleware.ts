import type { BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin.js';
import type { StaticBuildOptions } from '../types.js';
import { vitePluginMiddlewareBuild } from '../../middleware/vite-plugin.js';
export { MIDDLEWARE_MODULE_ID } from '../../middleware/vite-plugin.js';

export function pluginMiddleware(
	opts: StaticBuildOptions,
	internals: BuildInternals
): AstroBuildPlugin {
	return {
		build: 'ssr',
		hooks: {
			'build:before': () => {
				return {
					vitePlugin: vitePluginMiddlewareBuild(opts, internals),
				};
			},
		},
	};
}
