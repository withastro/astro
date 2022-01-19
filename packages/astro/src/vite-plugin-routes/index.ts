import type vite from '../core/vite';
import type { AstroConfig } from '../@types/astro';

const PLUGIN_NAME = '@astrojs/vite-plugin-routes';

interface PluginOptions {
	config: AstroConfig;
}

export function rollupPluginAstroBuildCSS(options: PluginOptions): vite.Plugin {
	const { config } = options;
	const styleSourceMap = new Map<string, string>();

	return {
		name: PLUGIN_NAME,
		
	};
}
