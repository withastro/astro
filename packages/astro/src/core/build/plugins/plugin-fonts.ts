import { vitePluginFontsBuild } from '../../../assets/fonts/vite-plugin-fonts-build.js';
import type { BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin.js';
import type { StaticBuildOptions } from '../types.js';

export function pluginFonts(
	options: StaticBuildOptions,
	internals: BuildInternals,
): AstroBuildPlugin {
	return {
		targets: ['server', 'client'],
		hooks: {
			'build:before': () => {
				return {
					vitePlugin: vitePluginFontsBuild(options, internals),
				};
			},
		},
	};
}
