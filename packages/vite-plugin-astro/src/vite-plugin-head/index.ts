import type * as vite from 'vite';
import type { DevEnvironment } from 'vite';
import { PROPAGATED_ASSET_FLAG } from '../core/head-propagation/boundary.js';
import {
	buildImporterGraphFromModuleInfo,
	computeInTreeAncestors,
} from '../core/head-propagation/graph.js';
import type { SSRComponentMetadata } from '../types.js';
import { getAstroMetadata } from '../vite-plugin-astro/metadata.js';
import type { PluginMetadata } from '../vite-plugin-astro/types.js';
import { RESOLVED_VIRTUAL_COMPONENT_METADATA, VIRTUAL_COMPONENT_METADATA } from './const.js';

export interface HeadPluginOptions {
	/**
	 * Names of the dev environments whose module graphs are tracked.
	 *
	 * @default every environment whose `consumer` is `server`
	 */
	environments?: readonly string[];
}

export default function configHeadVitePlugin({
	environments: environmentNames,
}: HeadPluginOptions = {}): vite.Plugin {
	// Adapters like `@astrojs/cloudflare` load page modules in the `prerender`
	// environment; default dev uses `ssr`. Track both so propagation covers either.
	let environments: DevEnvironment[] = [];

	function findModule(id: string) {
		for (const env of environments) {
			const mod = env.moduleGraph.getModuleById(id);
			if (mod) return mod;
		}
		return undefined;
	}

	function invalidateComponentMetadataModule() {
		for (const env of environments) {
			const virtualMod = env.moduleGraph.getModuleById(RESOLVED_VIRTUAL_COMPONENT_METADATA);
			// Clear only the transform result so the next dynamic import()
			// re-runs load/transform. A full invalidateModule() would cascade
			// to all importers, which in pre-bundled environments (e.g.
			// Cloudflare) includes the entire SSR module graph — causing
			// concurrent requests to observe partially-initialized modules.
			// See https://github.com/withastro/astro/issues/18132
			if (virtualMod?.transformResult) {
				const etag = virtualMod.transformResult.etag;
				if (etag) env.moduleGraph.etagToModuleMap.delete(etag);
				virtualMod.transformResult = null;
			}
		}
	}

	function buildImporterGraphFromEnvironment(seed: string) {
		// Start from one changed/imported module and walk upward to collect ancestors.
		const queue: string[] = [seed];
		const collected = new Set<string>();
		while (queue.length > 0) {
			const current = queue.pop()!;
			if (collected.has(current)) continue;
			collected.add(current);
			const mod = findModule(current);
			for (const importer of mod?.importers ?? []) {
				if (importer.id) {
					queue.push(importer.id);
				}
			}
		}

		// Convert Vite's module graph shape into our plain importer adjacency map.
		return buildImporterGraphFromModuleInfo(collected, (id) => {
			const mod = findModule(id);
			if (!mod) return null;
			return {
				importers: Array.from(mod.importers)
					.map((importer) => importer.id)
					.filter((moduleId): moduleId is string => !!moduleId),
				dynamicImporters: [],
			};
		});
	}

	function propagateMetadata<
		P extends keyof PluginMetadata['astro'],
		V extends PluginMetadata['astro'][P],
	>(
		this: { getModuleInfo(id: string): vite.Rolldown.ModuleInfo | null },
		seed: string,
		prop: P,
		value: V,
	) {
		// Example: `HeadEntry -> Layout -> /src/pages/blog.astro` marks both ancestors.
		const importerGraph = buildImporterGraphFromEnvironment(seed);
		const allAncestors = computeInTreeAncestors({
			seeds: [seed],
			importerGraph,
		});

		for (const id of allAncestors) {
			const info = this.getModuleInfo(id);
			if (info?.meta.astro) {
				const astroMetadata = getAstroMetadata(info);
				if (astroMetadata) {
					Reflect.set(astroMetadata, prop, value);
				}
			}
		}

		invalidateComponentMetadataModule();
	}

	return {
		name: 'astro:head-metadata',
		enforce: 'pre',
		apply: 'serve',
		configureServer(devServer) {
			environments = (
				environmentNames
					? environmentNames.map((name) => devServer.environments[name])
					: Object.values(devServer.environments).filter((e) => e.config.consumer === 'server')
			).filter((e): e is DevEnvironment => !!e);
			devServer.watcher.on('add', invalidateComponentMetadataModule);
			devServer.watcher.on('unlink', invalidateComponentMetadataModule);
			devServer.watcher.on('change', invalidateComponentMetadataModule);
		},
		load(id) {
			if (id !== RESOLVED_VIRTUAL_COMPONENT_METADATA) {
				return;
			}

			const seen = new Set<string>();
			const componentMetadataEntries: [string, SSRComponentMetadata][] = [];
			for (const env of environments) {
				for (const [moduleId, mod] of env.moduleGraph.idToModuleMap) {
					if (seen.has(moduleId)) continue;
					const info = this.getModuleInfo(moduleId) ?? (mod.id ? this.getModuleInfo(mod.id) : null);
					if (!info) continue;

					const astro = getAstroMetadata(info);
					if (!astro) continue;

					seen.add(moduleId);
					componentMetadataEntries.push([
						moduleId,
						{
							containsHead: astro.containsHead,
							propagation: astro.propagation,
						},
					]);
				}
			}

			return {
				code: `export const componentMetadataEntries = ${JSON.stringify(componentMetadataEntries)};`,
			};
		},
		resolveId(source, importer) {
			if (source === VIRTUAL_COMPONENT_METADATA) {
				return RESOLVED_VIRTUAL_COMPONENT_METADATA;
			}

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
		transform(_source, id) {
			if (id === RESOLVED_VIRTUAL_COMPONENT_METADATA) {
				// The virtual module only reports metadata that other modules own, so
				// transforming it cannot change what it emits. Invalidating it here
				// would make every evaluation schedule the next one: the invalidation
				// reaches the dev app entrypoint that imports it, the runner
				// re-evaluates that chain on the next request, re-fetches this module,
				// and arrives back here. https://github.com/withastro/astro/issues/17995
				return;
			}

			let info = this.getModuleInfo(id);
			if (info && getAstroMetadata(info)?.containsHead) {
				// Keep bubbling `containsHead` when this module was already marked earlier.
				propagateMetadata.call(this, id, 'containsHead', true);
			}

			const propagation = info && getAstroMetadata(info)?.propagation;
			if (propagation === 'self' || propagation === 'in-tree') {
				// Importers usually resolve this module before its metadata exists, so the
				// `resolveId` walk misses them. Seed from the importers so this module keeps `self`.
				// https://github.com/withastro/astro/issues/18509
				for (const importer of findModule(id)?.importers ?? []) {
					if (importer.id) {
						propagateMetadata.call(this, importer.id, 'propagation', 'in-tree');
					}
				}
			}

			if (id.includes(PROPAGATED_ASSET_FLAG)) {
				// Content render entries with ?astroPropagatedAssets need head propagation.
				propagateMetadata.call(this, id, 'propagation', 'in-tree');
			}

			invalidateComponentMetadataModule();
		},
	};
}
