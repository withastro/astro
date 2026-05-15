function computeInTreeAncestors(input) {
	const inTree = /* @__PURE__ */ new Set();
	const seen = /* @__PURE__ */ new Set();
	function walk(moduleId) {
		if (seen.has(moduleId)) return;
		seen.add(moduleId);
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
function buildImporterGraphFromModuleInfo(moduleIds, getModuleInfo) {
	const graph = /* @__PURE__ */ new Map();
	for (const id of moduleIds) {
		const mod = getModuleInfo(id);
		if (!mod) continue;
		graph.set(id, /* @__PURE__ */ new Set([...mod.importers, ...mod.dynamicImporters]));
	}
	return graph;
}
export { buildImporterGraphFromModuleInfo, computeInTreeAncestors };
