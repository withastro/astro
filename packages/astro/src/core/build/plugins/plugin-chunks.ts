import type { Plugin as VitePlugin } from 'vite';
import type { AstroBuildPlugin } from '../plugin.js';
// extendManualChunks functionality will be implemented inline

function vitePluginChunks(): VitePlugin {
	return {
		name: 'astro:chunks',
		outputOptions(_outputOptions) {
			// Astro runtime chunking removed - rely on natural chunking
			// If specific runtime chunking is needed, it can be re-added later
		},
	};
}

// Build plugin that configures specific chunking behavior
export function pluginChunks(): AstroBuildPlugin {
	return {
		targets: ['server'],
		hooks: {
			'build:before': () => {
				return {
					vitePlugin: vitePluginChunks(),
				};
			},
		},
	};
}
