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
									// and has at least two importers: the current page and something else
									moduleMeta.importers.length > 1
								) {
									// Now, we have to trace back the modules imported and analyze them;
									// understanding if a module is eventually shared between two pages isn't easy, because a module could
									// be imported by a page and a component that is eventually imported by a page.
									//
									// Given the previous statement, we only check if
									// - the module is a page, and it's not pre-rendered
									// - the module is the middleware
									// If one of these conditions is met, we need a separate chunk
									for (const importer of moduleMeta.importedIds) {
										// we don't want to analyze the same module again, so we skip it
										if (importer !== id) {
											const importerModuleMeta = meta.getModuleInfo(importer);
											if (importerModuleMeta) {
												// if the module is inside the pages
												if (importerModuleMeta.id.includes('/pages')) {
													// we check if it's not pre-rendered
													if (getPrerenderMetadata(importerModuleMeta) === false) {
														hasSharedModules = true;
														break;
													}
												}
												// module isn't an Astro route/page, it could be a middleware
												else if (importerModuleMeta.id.includes('/middleware')) {
													hasSharedModules = true;
													break;
												}
											}
										}
									}
								}
							}

							opts.allPages;
							pageInfo.hasSharedModules = hasSharedModules;
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
