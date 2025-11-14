import type { Plugin as VitePlugin } from 'vite';
import { vitePluginMiddlewareBuild } from '../../middleware/vite-plugin.js';
import type { BuildInternals } from '../internal.js';
import type { StaticBuildOptions } from '../types.js';

export function pluginMiddleware(
	opts: StaticBuildOptions,
	internals: BuildInternals,
): VitePlugin {
	const plugin = vitePluginMiddlewareBuild(opts, internals);
	return {
		...plugin,
		applyToEnvironment(environment) {
			return environment.name === 'ssr' || environment.name === 'prerender';
		},
	};
}
