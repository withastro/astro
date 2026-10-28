import type * as vite from 'vite';
import {
	buildImporterGraphFromModuleInfo,
	computeInTreeAncestors,
} from '@astrojs/runtime/internal/core/head-propagation/graph.js';
import { getTopLevelPageModuleInfos } from '../core/build/graph.js';
import type { BuildInternals } from '../core/build/internal.js';
import { PROPAGATED_ASSET_FLAG } from '../content/consts.js';
import type { SSRComponentMetadata, SSRResult } from '../types/public/internal.js';
import { getAstroMetadata } from '@astrojs/vite-plugin-astro/internal/vite-plugin-astro/metadata.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';

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
			// Head propagation hint seeds (content render entries with ?astroPropagatedAssets).
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
				for (const [id] of Object.entries(output.modules)) {
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
					// Modules with the ?astroPropagatedAssets query param are content render
					// entries that need head propagation. We identify them by their module ID
					// rather than scanning source code, which avoids an unfiltered transform
					// hook that would run on every module in the build.
					if (id.includes(PROPAGATED_ASSET_FLAG)) {
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
