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

export default function configHeadVitePlugin(): vite.Plugin {
	let environment: DevEnvironment;

	function buildImporterGraphFromEnvironment(seed: string) {
		// Start from one changed/imported module and walk upward to collect ancestors.
		const queue: string[] = [seed];
		const collected = new Set<string>();
		while (queue.length > 0) {
			const current = queue.pop()!;
			if (collected.has(current)) continue;
			collected.add(current);
			const mod = environment.moduleGraph.getModuleById(current);
			for (const importer of mod?.importers ?? []) {
				if (importer.id) {
					queue.push(importer.id);
				}
			}
		}

		// Convert Vite's module graph shape into our plain importer adjacency map.
		return buildImporterGraphFromModuleInfo(collected, (id) => {
			const mod = environment.moduleGraph.getModuleById(id);
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
	}

	return {
		name: 'astro:head-metadata',
		enforce: 'pre',
		apply: 'serve',
		configureServer(server) {
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
				// Keep bubbling `containsHead` when this module was already marked earlier.
				propagateMetadata.call(this, id, 'containsHead', true);
			}

			if (hasHeadInjectComment(source)) {
				// `// astro-head-inject` and `//! astro-head-inject` opt a module into bubbling.
				propagateMetadata.call(this, id, 'propagation', 'in-tree');
			}
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
