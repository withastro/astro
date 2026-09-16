export type ModuleId = string;
export type ImporterGraph = Map<ModuleId, Set<ModuleId>>;

/**
 * Computes all importer ancestors that should be treated as `in-tree`.
 *
 * @example
 * If `Button.astro` is imported by `PostLayout.astro`, which is imported by
 * `src/pages/blog.astro`, then seeding with `Button.astro` marks all three.
 */
export function computeInTreeAncestors(input: {
	seeds: Iterable<ModuleId>;
	importerGraph: ImporterGraph;
	stopAt?: (id: ModuleId) => boolean;
}): Set<ModuleId> {
	const inTree = new Set<ModuleId>();
	const seen = new Set<ModuleId>();

	function walk(moduleId: ModuleId) {
		if (seen.has(moduleId)) return;
		seen.add(moduleId);

		// Stop traversal at propagation boundaries.
		if (input.stopAt?.(moduleId)) {
			return;
		}

		inTree.add(moduleId);
		for (const importer of input.importerGraph.get(moduleId) ?? []) {
			walk(importer);
		}
	}

	for (const seed of input.seeds) {
		walk(seed);
	}

	return inTree;
}

export function buildImporterGraphFromModuleInfo(
	moduleIds: Iterable<ModuleId>,
	getModuleInfo: (
		id: string,
	) => { importers: readonly string[]; dynamicImporters: readonly string[] } | null,
): ImporterGraph {
	// Normalize host graph APIs into a single adjacency map.
	const graph: ImporterGraph = new Map();

	for (const id of moduleIds) {
		const mod = getModuleInfo(id);
		if (!mod) continue;
		graph.set(id, new Set([...mod.importers, ...mod.dynamicImporters]));
	}

	return graph;
}
