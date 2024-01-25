import path from 'node:path';
import type { Plugin as VitePlugin } from 'vite';
import { getPrerenderMetadata } from '../../../prerender/metadata.js';
import type { BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin.js';
import type { StaticBuildOptions } from '../types.js';
import { extendManualChunks } from './util.js';

function vitePluginPrerender(opts: StaticBuildOptions, internals: BuildInternals): VitePlugin {
	return {
		name: 'astro:rollup-plugin-prerender',

		outputOptions(outputOptions) {
			extendManualChunks(outputOptions, {
				after(id, meta) {
					// Split the Astro runtime into a separate chunk for readability
					if (id.includes('astro/dist/runtime')) {
						return 'astro';
					}
					const pageInfo = internals.pagesByViteID.get(id);
					let hasSharedModules = false;
					if (pageInfo) {
						// prerendered pages should be split into their own chunk
						// Important: this can't be in the `pages/` directory!
						if (getPrerenderMetadata(meta.getModuleInfo(id)!)) {
							const infoMeta = meta.getModuleInfo(id)!;

							// Here, we check if this page is importing modules that are shared among other modules e.g. middleware, other SSR pages, etc.
							// we loop the modules that the current page imports
							for (const moduleId of infoMeta.importedIds) {
								// we retrieve the metadata of the module
								const moduleMeta = meta.getModuleInfo(moduleId)!;
								if (
									// a shared modules should be inside the `src/` folder, at least
									moduleMeta.id.startsWith(opts.settings.config.srcDir.pathname) &&
									// and have at least two importers: the current page and something else
									moduleMeta.importers.length > 1
								) {
									hasSharedModules = true;
									break;
								}
							}

							pageInfo.route.hasSharedModules = hasSharedModules;
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
		targets: ['server'],
		hooks: {
			'build:before': () => {
				return {
					vitePlugin: vitePluginPrerender(opts, internals),
				};
			},
		},
	};
}
