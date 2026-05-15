type ServerIslandDiscovery = {
	resolvedPath: string;
	localName: string;
	specifier: string;
	importer: string;
};
type ServerIslandRecord = Omit<ServerIslandDiscovery, 'resolvedPath'> & {
	islandName: string;
};
export declare class ServerIslandsState {
	private islandsByResolvedPath;
	private resolvedPathByIslandName;
	private referenceIdByResolvedPath;
	hasIslands(): boolean;
	/**
	 * Record a discovered server island.
	 *
	 * Dedupe is based on `resolvedPath`: if the same resolved path is discovered
	 * again from a different importer/specifier, the first record is preserved.
	 * This keeps island names stable across repeated scans.
	 */
	discover(island: ServerIslandDiscovery): ServerIslandRecord;
	getDiscoveredIslands(): Iterable<ServerIslandRecord>;
	hasReferenceId(resolvedPath: string): boolean;
	setReferenceId(resolvedPath: string, referenceId: string): void;
	getDiscoveredIslandEntries(): Iterable<[string, ServerIslandRecord]>;
	/**
	 * Build import-map source from discovered islands.
	 *
	 * Used by non-SSR build output and dev replacement paths where we can import
	 * directly from discovered component paths.
	 */
	createImportMapSourceFromDiscovered(toImportPath: (fileName: string) => string): string;
	/**
	 * Build import-map source from Rollup reference ids.
	 *
	 * Used by SSR build output: reference ids are resolved to final emitted chunk
	 * file names before generating import() mappings.
	 */
	createImportMapSourceFromReferences(
		resolveFileName: (referenceId: string) => string,
		toImportPath: (fileName: string) => string,
	): string;
	createNameMapSource(): string;
	private createImportMapSource;
}
export {};
