import type { ModuleInfo } from 'rollup';
import type { AstroSettings, SSRResult } from '../@types/astro';
import type { BuildInternals } from '../core/build/internal.js';
import type { AstroBuildPlugin } from '../core/build/plugin.js';
import type { StaticBuildOptions } from '../core/build/types';

import type * as vite from 'vite';
import { walkParentInfos } from '../core/build/graph.js';
import { getAstroMetadata } from '../vite-plugin-astro/index.js';

const injectExp = /^\/\/\s*astro-head-inject/;
/**
 * If any component is marked as doing head injection, walk up the tree
 * and mark parent Astro components as having head injection in the tree.
 * This is used at runtime to determine if we should wait for head content
 * to be populated before rendering the entire tree.
 */
export default function configHeadPropagationVitePlugin({
	settings,
}: {
	settings: AstroSettings;
}): vite.Plugin {
	function addHeadInjectionInTree(
		graph: vite.ModuleGraph,
		id: string,
		getInfo: (id: string) => ModuleInfo | null,
		seen: Set<string> = new Set()
	) {
		const mod = server.moduleGraph.getModuleById(id);
		for (const parent of mod?.importers || []) {
			if (parent.id) {
				if (seen.has(parent.id)) {
					continue;
				} else {
					seen.add(parent.id);
				}
				const info = getInfo(parent.id);
				if (info?.meta.astro) {
					const astroMetadata = getAstroMetadata(info);
					if (astroMetadata) {
						astroMetadata.propagation = 'in-tree';
					}
				}
				addHeadInjectionInTree(graph, parent.id, getInfo, seen);
			}
		}
	}

	let server: vite.ViteDevServer;
	return {
		name: 'astro:head-propagation',
		configureServer(_server) {
			server = _server;
		},
		transform(source, id) {
			if (!server) {
				return;
			}

			if (injectExp.test(source)) {
				addHeadInjectionInTree(server.moduleGraph, id, (child) => this.getModuleInfo(child));
			}
		},
	};
}

export function astroHeadPropagationBuildPlugin(
	options: StaticBuildOptions,
	internals: BuildInternals
): AstroBuildPlugin {
	return {
		build: 'ssr',
		hooks: {
			'build:before'() {
				const map: SSRResult['propagation'] = new Map();
				return {
					vitePlugin: {
						name: 'vite-plugin-head-propagation-build',
						generateBundle(_opts, bundle) {
							const appendPropagation = (info: ModuleInfo) => {
								const astroMetadata = getAstroMetadata(info);
								if (astroMetadata) {
									astroMetadata.propagation = 'in-tree';
									map.set(info.id, 'in-tree');
								}
							};

							for (const [bundleId, output] of Object.entries(bundle)) {
								if (output.type !== 'chunk') continue;
								for (const [id, mod] of Object.entries(output.modules)) {
									if (mod.code && injectExp.test(mod.code)) {
										for (const [info] of walkParentInfos(id, this)) {
											appendPropagation(info);
										}

										const info = this.getModuleInfo(id);
										if (info) {
											appendPropagation(info);
										}
									}
								}
							}

							// Save the map to internals so it can be passed into SSR and generation
							internals.propagation = map;
						},
					},
				};
			},
		},
	};
}
