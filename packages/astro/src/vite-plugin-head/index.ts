import type { ModuleInfo } from 'rollup';
import type * as vite from 'vite';
import type { AstroSettings, SSRComponentMetadata, SSRResult } from '../@types/astro';
import type { AstroBuildPlugin } from '../core/build/plugin.js';
import type { StaticBuildOptions } from '../core/build/types';
import type { PluginMetadata } from '../vite-plugin-astro/types';

import { getTopLevelPages, walkParentInfos } from '../core/build/graph.js';
import type { BuildInternals } from '../core/build/internal.js';
import { getAstroMetadata } from '../vite-plugin-astro/index.js';

const injectExp = /^\/\/\s*astro-head-inject/;

export default function configHeadVitePlugin({
	settings,
}: {
	settings: AstroSettings;
}): vite.Plugin {
	let server: vite.ViteDevServer;

	function propagateMetadata<
		P extends keyof PluginMetadata['astro'],
		V extends PluginMetadata['astro'][P]
	>(
		this: { getModuleInfo(id: string): ModuleInfo | null },
		id: string,
		prop: P,
		value: V,
		seen = new Set<string>()
	) {
		if (seen.has(id)) return;
		seen.add(id);
		const mod = server.moduleGraph.getModuleById(id);
		const info = this.getModuleInfo(id);
		console.log('propagateMetadata', { id, mod });
		if (info?.meta.astro) {
			const astroMetadata = getAstroMetadata(info);
			if (astroMetadata) {
				Reflect.set(astroMetadata, prop, value);
			}
		}

		for (const parent of mod?.importers || []) {
			if (parent.id) {
				propagateMetadata.call(this, parent.id, prop, value, seen);
			}
		}
	}

	return {
		name: 'astro:head-metadata',
		configureServer(_server) {
			server = _server;
		},
		transform(source, id) {
			if (!server) {
				return;
			}

			let info = this.getModuleInfo(id);
			if (info && getAstroMetadata(info)?.containsHead) {
				propagateMetadata.call(this, id, 'containsHead', true);
			}

			if (injectExp.test(source)) {
				propagateMetadata.call(this, id, 'propagation', 'in-tree');
			}
		},
	};
}

export function astroHeadBuildPlugin(
	options: StaticBuildOptions,
	internals: BuildInternals
): AstroBuildPlugin {
	return {
		build: 'ssr',
		hooks: {
			'build:before'() {
				return {
					vitePlugin: {
						name: 'astro:head-metadata-build',
						generateBundle(_opts, bundle) {
							const map: SSRResult['componentMetadata'] = internals.componentMetadata;
							function getOrCreateMetadata(id: string): SSRComponentMetadata {
								if (map.has(id)) return map.get(id)!;
								const metadata: SSRComponentMetadata = {
									propagation: 'none',
									containsHead: false,
								};
								map.set(id, metadata);
								return metadata;
							}

							for (const [, output] of Object.entries(bundle)) {
								if (output.type !== 'chunk') continue;
								for (const [id, mod] of Object.entries(output.modules)) {
									const modinfo = this.getModuleInfo(id);

									// <head> tag in the tree
									if (modinfo && getAstroMetadata(modinfo)?.containsHead) {
										for (const [pageInfo] of getTopLevelPages(id, this)) {
											let metadata = getOrCreateMetadata(pageInfo.id);
											metadata.containsHead = true;
										}
									}

									// Head propagation (aka bubbling)
									if (mod.code && injectExp.test(mod.code)) {
										for (const [info] of walkParentInfos(id, this)) {
											getOrCreateMetadata(info.id).propagation = 'in-tree';
										}
									}
								}
							}
						},
					},
				};
			},
		},
	};
}
