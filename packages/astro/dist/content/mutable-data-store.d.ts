import { type PathLike } from 'node:fs';
import { type DataEntry, ImmutableDataStore } from './data-store.js';
/**
 * Extends the DataStore with the ability to change entries and write them to disk.
 * This is kept as a separate class to avoid needing node builtins at runtime, when read-only access is all that is needed.
 */
export declare class MutableDataStore extends ImmutableDataStore {
	#private;
	set(collectionName: string, key: string, value: unknown): void;
	delete(collectionName: string, key: string): void;
	clear(collectionName: string): void;
	clearAll(): void;
	addAssetImport(assetImport: string, filePath?: string): void;
	addAssetImports(assets: Array<string>, filePath?: string): void;
	addModuleImport(fileName: string): void;
	writeAssetImports(filePath: PathLike): Promise<void>;
	writeModuleImports(filePath: PathLike): Promise<void>;
	scopedStore(collectionName: string): DataStore;
	/**
	 * Returns a MetaStore for a given collection, or if no collection is provided, the default meta collection.
	 */
	metaStore(collectionName?: string): MetaStore;
	/**
	 * Returns a promise that resolves when all pending saves are complete.
	 * This includes any in-progress debounced saves for the data store, asset imports, and module imports.
	 */
	waitUntilSaveComplete(): Promise<void>;
	toString(): string;
	writeToDisk(): Promise<void>;
	/**
	 * Attempts to load a MutableDataStore from the virtual module.
	 * This only works in Vite.
	 */
	static fromModule(): Promise<MutableDataStore>;
	static fromMap(data: Map<string, Map<string, any>>): Promise<MutableDataStore>;
	static fromString(data: string): Promise<MutableDataStore>;
	static fromFile(filePath: string | URL): Promise<MutableDataStore>;
}
export interface DataStore {
	get: <TData extends Record<string, unknown> = Record<string, unknown>>(
		key: string,
	) => DataEntry<TData> | undefined;
	entries: () => Array<[id: string, DataEntry]>;
	set: <TData extends Record<string, unknown>>(opts: DataEntry<TData>) => boolean;
	values: () => Array<DataEntry>;
	keys: () => Array<string>;
	delete: (key: string) => void;
	clear: () => void;
	has: (key: string) => boolean;
	/**
	 * Adds a single asset to the store. This asset will be transformed
	 * by Vite, and the URL will be available in the final build.
	 * @param fileName
	 * @param specifier
	 * @returns
	 */
	addModuleImport: (fileName: string) => void;
}
/**
 * A key-value store for metadata strings. Useful for storing things like sync tokens.
 */
export interface MetaStore {
	get: (key: string) => string | undefined;
	set: (key: string, value: string) => void;
	has: (key: string) => boolean;
	delete: (key: string) => void;
}
