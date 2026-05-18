import type { ModuleInfo } from 'rollup';
import type * as vite from 'vite';
import type { DevEnvironment } from 'vite';
import { hasHeadInjectComment } from '../core/head-propagation/comment.js';
import {
	buildImporterGraphFromModuleInfo,
	computeInTreeAncestors,
} from '../core/head-propagation/graph.js';
import { getTopLevelPageModuleInfos } from '../core/build/graph.js';
import type { BuildInternals } from '../core/build/internal.js';
import type { SSRComponentMetadata, SSRResult } from '../types/public/internal.js';
import { getAstroMetadata } from '../vite-plugin-astro/index.js';
import type { PluginMetadata } from '../vite-plugin-astro/types.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';

/**
 * A dev-only virtual module that exposes accumulated component metadata (containsHead, propagation)
 * as a serialized array that can be statically imported.
 *
 * This exists to serve pipelines that cannot do live module graph traversal at request time —
 * specifically `NonRunnablePipeline`, used by adapters like Cloudflare that run requests through
 * their own server runtime rather than Vite's runner. Those pipelines cannot call
 * `getComponentMetadata()` (which requires a `ModuleLoader`), so they import this virtual module
 * instead to get equivalent metadata.
 *
 * The `RunnablePipeline` does NOT use this module; it calls `getComponentMetadata()` directly,
 * which traverses the live Vite module graph and produces more accurate per-request data.
 *
 * The virtual module is invalidated whenever metadata propagation runs (on transform, resolveId)
 * and on file add/unlink, ensuring it stays fresh during HMR.
 */
const VIRTUAL_COMPONENT_METADATA = 'virtual:astro:component-metadata';
const RESOLVED_VIRTUAL_COMPONENT_METADATA = `\0${VIRTUAL_COMPONENT_METADATA}`;

export default function configHeadVitePlugin(): vite.Plugin {
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
			if (virtualMod) {
				env.moduleGraph.invalidateModule(virtualMod);
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
	>(this: { getModuleInfo(id: string): ModuleInfo | null }, seed: string, prop: P, value: V) {
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
			environments = [
				devServer.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr],
				devServer.environments[ASTRO_VITE_ENVIRONMENT_NAMES.prerender],
			].filter((e): e is DevEnvironment => !!e);
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
		transform(source, id) {
			let info = this.getModuleInfo(id);
			if (info && getAstroMetadata(info)?.containsHead) {
				// Keep bubbling `containsHead` when this module was already marked earlier.
				propagateMetadata.call(this, id, 'containsHead', true);
			}

			if (hasHeadInjectComment(source)) {
				// `// astro-head-inject` and `//! astro-head-inject` opt a module into bubbling.
				propagateMetadata.call(this, id, 'propagation', 'in-tree');
			}

			invalidateComponentMetadataModule();
		},
	};
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
			const moduleIds = new Set<string>();
			// Explicit runtime entries (`createComponent({ propagation: 'self' })`).
			const selfPropagationSeeds = new Set<string>();
			// Comment-driven seeds (`astro-head-inject` marker in source).
			const commentPropagationSeeds = new Set<string>();
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
					moduleIds.add(id);
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
							selfPropagationSeeds.add(id);
						}
					}

					// Head propagation (aka bubbling)
					if (mod.code && hasHeadInjectComment(mod.code)) {
						commentPropagationSeeds.add(id);
					}
				}
			}

			// Build once, then compute all ancestors from both seed kinds.
			const importerGraph = buildImporterGraphFromModuleInfo(moduleIds, (id) =>
				this.getModuleInfo(id),
			);
			const allPropagationSeeds = new Set([...selfPropagationSeeds, ...commentPropagationSeeds]);
			const allAncestors = computeInTreeAncestors({
				seeds: allPropagationSeeds,
				importerGraph,
			});

			for (const id of allAncestors) {
				const metadata = getOrCreateMetadata(id);
				// Preserve explicit `self`; only promote others to `in-tree`.
				if (metadata.propagation !== 'self') {
					metadata.propagation = 'in-tree';
				}
			}
		},
	};
}
