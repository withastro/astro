class ServerIslandsState {
	// Canonical source of discovered islands keyed by resolved component path.
	islandsByResolvedPath = /* @__PURE__ */ new Map();
	// Reverse lookup used to keep island names unique and stable.
	resolvedPathByIslandName = /* @__PURE__ */ new Map();
	// Rollup reference ids emitted for SSR chunks, keyed by resolved path.
	referenceIdByResolvedPath = /* @__PURE__ */ new Map();
	hasIslands() {
		return this.islandsByResolvedPath.size > 0;
	}
	/**
	 * Record a discovered server island.
	 *
	 * Dedupe is based on `resolvedPath`: if the same resolved path is discovered
	 * again from a different importer/specifier, the first record is preserved.
	 * This keeps island names stable across repeated scans.
	 */
	discover(island) {
		const { resolvedPath, ...discovery } = island;
		const existing = this.islandsByResolvedPath.get(resolvedPath);
		if (existing) {
			return existing;
		}
		let name = island.localName;
		let idx = 1;
		while (this.resolvedPathByIslandName.has(name)) {
			name += idx++;
		}
		const record = {
			...discovery,
			islandName: name,
		};
		this.islandsByResolvedPath.set(resolvedPath, record);
		this.resolvedPathByIslandName.set(name, resolvedPath);
		return record;
	}
	getDiscoveredIslands() {
		return this.islandsByResolvedPath.values();
	}
	hasReferenceId(resolvedPath) {
		return this.referenceIdByResolvedPath.has(resolvedPath);
	}
	setReferenceId(resolvedPath, referenceId) {
		this.referenceIdByResolvedPath.set(resolvedPath, referenceId);
	}
	getDiscoveredIslandEntries() {
		return this.islandsByResolvedPath.entries();
	}
	/**
	 * Build import-map source from discovered islands.
	 *
	 * Used by non-SSR build output and dev replacement paths where we can import
	 * directly from discovered component paths.
	 */
	createImportMapSourceFromDiscovered(toImportPath) {
		const entries = Array.from(this.islandsByResolvedPath, ([resolvedPath, island]) => [
			island.islandName,
			resolvedPath,
		]);
		return this.createImportMapSource(entries, toImportPath);
	}
	/**
	 * Build import-map source from Rollup reference ids.
	 *
	 * Used by SSR build output: reference ids are resolved to final emitted chunk
	 * file names before generating import() mappings.
	 */
	createImportMapSourceFromReferences(resolveFileName, toImportPath) {
		const entries = [];
		for (const [resolvedPath, referenceId] of this.referenceIdByResolvedPath) {
			const island = this.islandsByResolvedPath.get(resolvedPath);
			if (!island) continue;
			entries.push([island.islandName, resolveFileName(referenceId)]);
		}
		return this.createImportMapSource(entries, toImportPath);
	}
	createNameMapSource() {
		const entries = Array.from(this.islandsByResolvedPath, ([resolvedPath, island]) => [
			resolvedPath,
			island.islandName,
		]);
		return `new Map(${JSON.stringify(entries, null, 2)})`;
	}
	createImportMapSource(entries, toImportPath) {
		const mappings = Array.from(entries, ([islandName, fileName]) => {
			const importPath = toImportPath(fileName);
			return `	[${JSON.stringify(islandName)}, () => import(${JSON.stringify(importPath)})],`;
		});
		return `new Map([
${mappings.join('\n')}
])`;
	}
}
export { ServerIslandsState };
