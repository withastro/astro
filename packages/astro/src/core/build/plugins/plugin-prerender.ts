import path from 'node:path';
import type { Plugin as VitePlugin } from 'vite';
import type { BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin.js';
import type { StaticBuildOptions } from '../types';
import { extendManualChunks } from './util.js';
import { getPrerenderMetadata } from '../../../prerender/metadata.js';

function vitePluginPrerender(opts: StaticBuildOptions, internals: BuildInternals): VitePlugin {
	return {
		name: 'astro:rollup-plugin-prerender',

		outputOptions(outputOptions) {
			extendManualChunks(outputOptions, {
				after(id, meta) {
					// Split the Astro runtime into a separate chunk for readability
					if (id.includes('astro/dist')) {
						return 'astro';
					}
					const pageInfo = internals.pagesByViteID.get(id);
					if (pageInfo) {
						// prerendered pages should be split into their own chunk
						// Important: this can't be in the `pages/` directory!
						if (getPrerenderMetadata(meta.getModuleInfo(id))) {
							pageInfo.route.prerender = true;
							return 'prerender';
						}
						pageInfo.route.prerender = false;
						// dynamic pages should all go in their own chunk in the pages/* directory
						return `pages/${path.basename(pageInfo.component)}`;
					}
				},
			});
		},
	};
}

export function pluginPrerender(
	opts: StaticBuildOptions,
	internals: BuildInternals
): AstroBuildPlugin {
	return {
		build: 'ssr',
		hooks: {
			'build:before': () => {
				return {
					vitePlugin: vitePluginPrerender(opts, internals),
				};
			},
		},
	};
}
