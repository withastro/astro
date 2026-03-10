import type { ModuleInfo } from 'rollup';
import type * as vite from 'vite';
import type { DevEnvironment } from 'vite';
import { getParentModuleInfos, getTopLevelPageModuleInfos } from '../core/build/graph.js';
import type { BuildInternals } from '../core/build/internal.js';
import type { SSRComponentMetadata, SSRResult } from '../types/public/internal.js';
import { getAstroMetadata } from '../vite-plugin-astro/index.js';
import type { PluginMetadata } from '../vite-plugin-astro/types.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';

// Detect this in comments, both in .astro components and in js/ts files.
const injectExp = /(?:^\/\/|\/\/!)\s*astro-head-inject/;

export const DEV_COMPONENT_METADATA_ID = 'virtual:astro:dev-component-metadata';
const DEV_COMPONENT_METADATA_RESOLVED_ID = '\0' + DEV_COMPONENT_METADATA_ID;

export default function configHeadVitePlugin(): vite.Plugin[] {
	let environment: DevEnvironment;
	let server: vite.ViteDevServer;

	function propagateMetadata<
		P extends keyof PluginMetadata['astro'],
		V extends PluginMetadata['astro'][P],
	>(
		this: { getModuleInfo(id: string): ModuleInfo | null },
		id: string,
		prop: P,
		value: V,
		seen = new Set<string>(),
	) {
		if (seen.has(id)) return;
		seen.add(id);
		const mod = environment.moduleGraph.getModuleById(id);
		const info = this.getModuleInfo(id);

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

	return [
		{
			name: 'astro:head-metadata',
			enforce: 'pre',
			apply: 'serve',
			configureServer(_server) {
				server = _server;
				environment = server.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr];
			},
			resolveId(source, importer) {
				if (importer) {
					// Do propagation any time a new module is imported. This is because
					// A module with propagation might be loaded before one of its parent pages
					// is loaded, in which case that parent page won't have the in-tree and containsHead
					// values. Walking up the tree in resolveId ensures that they do
					return this.resolve(source, importer, { skipSelf: true }).then((result) => {
						if (result) {
							let info = this.getModuleInfo(result.id);
							const astro = info && getAstroMetadata(info);
							if (astro) {
								if (astro.propagation === 'self' || astro.propagation === 'in-tree') {
									propagateMetadata.call(this, importer, 'propagation', 'in-tree');
								}
								if (astro.containsHead) {
									propagateMetadata.call(this, importer, 'containsHead', true);
								}
							}
						}
						return result;
					});
				}
			},
			transform(source, id) {
				let info = this.getModuleInfo(id);
				if (info && getAstroMetadata(info)?.containsHead) {
					propagateMetadata.call(this, id, 'containsHead', true);
				}

				if (injectExp.test(source)) {
					propagateMetadata.call(this, id, 'propagation', 'in-tree');
				}
			},
		},
		{
			// Virtual module that exposes componentMetadata collected by the head-metadata plugin.
			// This is used by NonRunnablePipeline (e.g. Cloudflare workerd) which cannot access
			// the Vite module graph directly at render time.
			name: 'astro:dev-component-metadata',
			apply: 'serve',
			resolveId: {
				filter: {
					id: new RegExp(`^${DEV_COMPONENT_METADATA_ID}$`),
				},
				handler() {
					return DEV_COMPONENT_METADATA_RESOLVED_ID;
				},
			},
			load: {
				filter: {
					id: new RegExp(`^\\0${DEV_COMPONENT_METADATA_ID}$`),
				},
				handler() {
					// Collect all component metadata from the SSR environment's module graph.
					// The head-metadata plugin has already propagated 'in-tree' and 'containsHead'
					// up through the module graph during resolveId/transform.
					const entries: [string, SSRComponentMetadata][] = [];
					const ssrEnv = server?.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr];
					if (ssrEnv) {
						for (const [id] of ssrEnv.moduleGraph.idToModuleMap) {
							const info = ssrEnv.pluginContainer.getModuleInfo(id);
							if (info) {
								const astro = getAstroMetadata(info);
								if (astro && (astro.propagation !== 'none' || astro.containsHead)) {
									entries.push([
										id,
										{
											propagation: astro.propagation || 'none',
											containsHead: astro.containsHead || false,
										},
									]);
								}
							}
						}
					}
					return {
						code: `export const componentMetadata = new Map(${JSON.stringify(entries)});`,
					};
				},
			},
		},
	];
}

export function astroHeadBuildPlugin(internals: BuildInternals): vite.Plugin {
	return {
		name: 'astro:head-metadata-build',
		applyToEnvironment(environment) {
			return (
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
			);
		},
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
					if (modinfo) {
						const meta = getAstroMetadata(modinfo);
						if (meta?.containsHead) {
							for (const pageInfo of getTopLevelPageModuleInfos(id, this)) {
								let metadata = getOrCreateMetadata(pageInfo.id);
								metadata.containsHead = true;
							}
						}
						if (meta?.propagation === 'self') {
							for (const info of getParentModuleInfos(id, this)) {
								let metadata = getOrCreateMetadata(info.id);
								if (metadata.propagation !== 'self') {
									metadata.propagation = 'in-tree';
								}
							}
						}
					}

					// Head propagation (aka bubbling)
					if (mod.code && injectExp.test(mod.code)) {
						for (const info of getParentModuleInfos(id, this)) {
							getOrCreateMetadata(info.id).propagation = 'in-tree';
						}
					}
				}
			}
		},
	};
}
