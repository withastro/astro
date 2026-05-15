export type ModuleId = string;
export type ImporterGraph = Map<ModuleId, Set<ModuleId>>;
/**
 * Computes all importer ancestors that should be treated as `in-tree`.
 *
 * @example
 * If `Button.astro` is imported by `PostLayout.astro`, which is imported by
 * `src/pages/blog.astro`, then seeding with `Button.astro` marks all three.
 */
export declare function computeInTreeAncestors(input: {
	seeds: Iterable<ModuleId>;
	importerGraph: ImporterGraph;
	stopAt?: (id: ModuleId) => boolean;
}): Set<ModuleId>;
export declare function buildImporterGraphFromModuleInfo(
	moduleIds: Iterable<ModuleId>,
	getModuleInfo: (id: string) => {
		importers: readonly string[];
		dynamicImporters: readonly string[];
	} | null,
): ImporterGraph;
