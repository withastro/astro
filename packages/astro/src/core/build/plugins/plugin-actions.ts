import type { Plugin as VitePlugin } from 'vite';
import { vitePluginActionsBuild } from '../../../actions/vite-plugin-actions.js';
import type { BuildInternals } from '../internal.js';
import type { StaticBuildOptions } from '../types.js';

export function pluginActions(
	opts: StaticBuildOptions,
	internals: BuildInternals,
): VitePlugin {
	const plugin = vitePluginActionsBuild(opts, internals);
	return {
		...plugin,
		applyToEnvironment(environment) {
			return environment.name === 'ssr';
		},
	};
}
