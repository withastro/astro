import type { Plugin as VitePlugin } from 'vite';
import type { AstroSettings } from '../types/astro.js';

const initializationVirtualModuleId = 'astro:initialize';
const resolvedInitializationVirtualModuleId = '\0' + initializationVirtualModuleId;

export function vitePluginServerInitialize({ settings }: { settings: AstroSettings }): VitePlugin {
	return {
		name: '@astrojs/vite-plugin-server-initialize',
		resolveId(id) {
			if (id === initializationVirtualModuleId) return resolvedInitializationVirtualModuleId;
		},
		load(id) {
			if (id !== resolvedInitializationVirtualModuleId) return;

			return settings.initializers.length === 0
				? 'export {};'
				: settings.initializers
						.map((initializer) => `import ${JSON.stringify(initializer)};`)
						.join('\n');
		},
	};
}
