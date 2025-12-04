import type { Plugin as VitePlugin } from 'vite';
import { vitePluginMiddlewareBuild } from '../../middleware/vite-plugin.js';
import type { BuildInternals } from '../internal.js';
import type { StaticBuildOptions } from '../types.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../constants.js';

export function pluginMiddleware(
	opts: StaticBuildOptions,
	internals: BuildInternals,
): VitePlugin {
	const plugin = vitePluginMiddlewareBuild(opts, internals);
	return {
		...plugin,
		applyToEnvironment(environment) {
			return environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr;
		},
	};
}
