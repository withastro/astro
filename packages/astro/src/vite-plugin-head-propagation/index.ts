import type { ModuleInfo } from 'rollup';
import type { AstroSettings } from '../@types/astro';

import * as vite from 'vite';
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
