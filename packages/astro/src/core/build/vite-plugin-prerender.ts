import type { Plugin as VitePlugin } from 'vite';
import type { BuildInternals } from './internal.js';
import type { StaticBuildOptions } from './types';

export function vitePluginPrerender(
	opts: StaticBuildOptions,
	internals: BuildInternals
): VitePlugin {
	return {
		name: 'astro:rollup-plugin-prerender',

		outputOptions(outputOptions) {
			const manualChunks = outputOptions.manualChunks || Function.prototype;
			outputOptions.manualChunks = function (id, api, ...args) {
				// Defer to user-provided `manualChunks`, if it was provided.
				if (typeof manualChunks == 'object') {
					if (id in manualChunks) {
						return manualChunks[id];
					}
				} else if (typeof manualChunks === 'function') {
					const outid = manualChunks.call(this, id, api, ...args);
					if (outid) {
						return outid;
					}
				}
				// Split the Astro runtime into a separate chunk for readability
				if (id.includes('astro/dist')) {
					return 'astro';
				}
				const pageInfo = internals.pagesByViteID.get(id);
				if (pageInfo) {
					// prerendered pages should be split into their own chunk
					// Important: this can't be in the `pages/` directory!
					if (api.getModuleInfo(id)?.meta.astro?.pageOptions?.prerender) {
						return `prerender`;
					}
					// dynamic pages should all go in their own chunk in the pages/* directory
					return `pages/all`;
				}
			};
		},
	};
}
