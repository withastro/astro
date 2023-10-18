import type { Plugin as VitePlugin } from 'vite';
import type { AstroBuildPlugin } from '../plugin.js';
import { extendManualChunks } from './util.js';

export function vitePluginChunks(): VitePlugin {
    return {
        name: 'astro:chunks',
        outputOptions(outputOptions) {
            extendManualChunks(outputOptions, {
                after(id) {
                    if (id.includes('astro/dist/runtime/server/')) {
                        return 'astro'
                    }
                },
            });
        }
    }
}

export function pluginChunks(): AstroBuildPlugin {
	return {
		targets: ['server', 'content'],
		hooks: {
			'build:before': () => {
				return {
					vitePlugin: vitePluginChunks(),
				};
			},
		},
	};
}
