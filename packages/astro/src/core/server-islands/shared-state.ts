type ServerIslandDiscovery = {
	resolvedPath: string;
	localName: string;
	specifier: string;
	importer: string;
};

type ServerIslandRecord = ServerIslandDiscovery & {
	islandName: string;
};

export class ServerIslandsState {
	// Canonical source of discovered islands keyed by resolved component path.
	private islandsByResolvedPath = new Map<string, ServerIslandRecord>();
	// Reverse lookup used to keep island names unique and stable.
	private resolvedPathByIslandName = new Map<string, string>();
	// Rollup reference ids emitted for SSR chunks, keyed by resolved path.
	private referenceIdByResolvedPath = new Map<string, string>();

	hasIslands(): boolean {
		return this.islandsByResolvedPath.size > 0;
	}

	discover(island: ServerIslandDiscovery): ServerIslandRecord {
		// If this island was already discovered from another importer, keep the first record.
		const existing = this.islandsByResolvedPath.get(island.resolvedPath);
		if (existing) {
			return existing;
		}

		let name = island.localName;
		let idx = 1;
		while (this.resolvedPathByIslandName.has(name)) {
			name += idx++;
		}

		const record: ServerIslandRecord = {
			...island,
			islandName: name,
		};

		this.islandsByResolvedPath.set(island.resolvedPath, record);
		this.resolvedPathByIslandName.set(name, island.resolvedPath);

		return record;
	}

	getDiscoveredIslands(): Iterable<ServerIslandRecord> {
		return this.islandsByResolvedPath.values();
	}

	hasReferenceId(resolvedPath: string): boolean {
		return this.referenceIdByResolvedPath.has(resolvedPath);
	}

	setReferenceId(resolvedPath: string, referenceId: string): void {
		this.referenceIdByResolvedPath.set(resolvedPath, referenceId);
	}

	createImportMapSourceFromDiscovered(toImportPath: (fileName: string) => string): string {
		const entries = Array.from(this.islandsByResolvedPath.values(), (island): [string, string] => [
			island.islandName,
			island.resolvedPath,
		]);

		return this.createImportMapSource(entries, toImportPath);
	}

	createImportMapSourceFromReferences(
		resolveFileName: (referenceId: string) => string,
		toImportPath: (fileName: string) => string,
	): string {
		// Convert emitted reference ids to final chunk file names before generating import map source.
		const entries: Array<[string, string]> = [];

		for (const [resolvedPath, referenceId] of this.referenceIdByResolvedPath) {
			const island = this.islandsByResolvedPath.get(resolvedPath);
			if (!island) continue;
			entries.push([island.islandName, resolveFileName(referenceId)]);
		}

		return this.createImportMapSource(entries, toImportPath);
	}

	createNameMapSource(): string {
		// Produces source for Map<resolvedPath, islandName>.
		// Example: ['/src/components/Island.astro', 'Island']
		const entries = Array.from(this.islandsByResolvedPath.values(), (island): [string, string] => [
			island.resolvedPath,
			island.islandName,
		]);
		return `new Map(${JSON.stringify(entries, null, 2)})`;
	}

	private createImportMapSource(
		entries: Iterable<[string, string]>,
		toImportPath: (fileName: string) => string,
	): string {
		// Produces source for Map<islandName, () => import(path)>.
		// Example: ['Island', () => import('./chunks/island.mjs')]
		const mappings = Array.from(entries, ([islandName, fileName]) => {
			const importPath = toImportPath(fileName);
			return `\t[${JSON.stringify(islandName)}, () => import(${JSON.stringify(importPath)})],`;
		});

		return `new Map([\n${mappings.join('\n')}\n])`;
	}
}
