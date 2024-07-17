import { promises as fs, type PathLike, existsSync } from 'fs';
import { imageSrcToImportId, importIdToSymbolName } from '../assets/utils/resolveImports.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';

const SAVE_DEBOUNCE_MS = 500;

export interface RenderedContent {
	html: string;
	metadata?: {
		imagePaths: Array<string>;
		[key: string]: unknown;
	};
}

export interface DataEntry {
	id: string;
	data: Record<string, unknown>;
	filePath?: string;
	body?: string;
	digest?: number | string;
	rendered?: RenderedContent;
}

export class DataStore {
	#collections = new Map<string, Map<string, any>>();

	#file?: PathLike;

	#assetsFile?: PathLike;

	#saveTimeout: NodeJS.Timeout | undefined;
	#assetsSaveTimeout: NodeJS.Timeout | undefined;

	#dirty = false;
	#assetsDirty = false;

	#assetImports = new Set<string>();

	constructor() {
		this.#collections = new Map();
	}
	get<T = unknown>(collectionName: string, key: string): T | undefined {
		return this.#collections.get(collectionName)?.get(String(key));
	}
	entries<T = unknown>(collectionName: string): Array<[id: string, T]> {
		const collection = this.#collections.get(collectionName) ?? new Map();
		return [...collection.entries()];
	}
	values<T = unknown>(collectionName: string): Array<T> {
		const collection = this.#collections.get(collectionName) ?? new Map();
		return [...collection.values()];
	}
	keys(collectionName: string): Array<string> {
		const collection = this.#collections.get(collectionName) ?? new Map();
		return [...collection.keys()];
	}
	set(collectionName: string, key: string, value: unknown) {
		const collection = this.#collections.get(collectionName) ?? new Map();
		collection.set(String(key), value);
		this.#collections.set(collectionName, collection);
		this.#saveToDiskDebounced();
	}
	delete(collectionName: string, key: string) {
		const collection = this.#collections.get(collectionName);
		if (collection) {
			collection.delete(String(key));
			this.#saveToDiskDebounced();
		}
	}
	clear(collectionName: string) {
		this.#collections.delete(collectionName);
		this.#saveToDiskDebounced();
	}

	has(collectionName: string, key: string) {
		const collection = this.#collections.get(collectionName);
		if (collection) {
			return collection.has(String(key));
		}
		return false;
	}

	hasCollection(collectionName: string) {
		return this.#collections.has(collectionName);
	}

	collections() {
		return this.#collections;
	}

	addAssetImport(assetImport: string, filePath: string) {
		const id = imageSrcToImportId(assetImport, filePath);
		if (id) {
			this.#assetImports.add(id);
			// We debounce the writes to disk because addAssetImport is called for every image in every file,
			// and can be called many times in quick succession by a filesystem watcher. We only want to write
			// the file once, after all the imports have been added.
			this.#writeAssetsImportsDebounced();
		}
	}

	addAssetImports(assets: Array<string>, filePath: string) {
		assets.forEach((asset) => this.addAssetImport(asset, filePath));
	}

	async writeAssetImports(filePath: PathLike) {
		this.#assetsFile = filePath;

		if (this.#assetImports.size === 0) {
			try {
				await fs.writeFile(filePath, 'export default new Map();');
			} catch (err) {
				throw new AstroError({
					...(err as Error),
					...AstroErrorData.ContentLayerWriteError,
				});
			}
		}

		if (!this.#assetsDirty && existsSync(filePath)) {
			return;
		}
		// Import the assets, with a symbol name that is unique to the import id. The import
		// for each asset is an object with path, format and dimensions.
		// We then export them all, mapped by the import id, so we can find them again in the build.
		const imports: Array<string> = [];
		const exports: Array<string> = [];
		this.#assetImports.forEach((id) => {
			const symbol = importIdToSymbolName(id);
			imports.push(`import ${symbol} from '${id}';`);
			exports.push(`[${JSON.stringify(id)}, ${symbol}]`);
		});
		const code = /* js */ `
${imports.join('\n')}
export default new Map([${exports.join(', ')}]);
		`;
		try {
			await fs.writeFile(filePath, code);
		} catch (err) {
			throw new AstroError({
				...(err as Error),
				...AstroErrorData.ContentLayerWriteError,
			});
		}
		this.#assetsDirty = false;
	}

	#writeAssetsImportsDebounced() {
		this.#assetsDirty = true;
		if (this.#assetsFile) {
			if (this.#assetsSaveTimeout) {
				clearTimeout(this.#assetsSaveTimeout);
			}
			this.#assetsSaveTimeout = setTimeout(() => {
				this.#assetsSaveTimeout = undefined;
				this.writeAssetImports(this.#assetsFile!);
			}, SAVE_DEBOUNCE_MS);
		}
	}

	#saveToDiskDebounced() {
		this.#dirty = true;
		// Only save to disk if it has already been saved once
		if (this.#file) {
			if (this.#saveTimeout) {
				clearTimeout(this.#saveTimeout);
			}
			this.#saveTimeout = setTimeout(() => {
				this.#saveTimeout = undefined;
				this.writeToDisk(this.#file!);
			}, SAVE_DEBOUNCE_MS);
		}
	}

	scopedStore(collectionName: string): ScopedDataStore {
		return {
			get: (key: string) => this.get<DataEntry>(collectionName, key),
			entries: () => this.entries(collectionName),
			values: () => this.values(collectionName),
			keys: () => this.keys(collectionName),
			set: ({ id: key, data, body, filePath, digest, rendered }) => {
				if (!key) {
					throw new Error(`ID must be a non-empty string`);
				}
				const id = String(key);
				if (digest) {
					const existing = this.get<DataEntry>(collectionName, id);
					if (existing && existing.digest === digest) {
						return false;
					}
				}
				const entry: DataEntry = {
					id,
					data,
				};
				// We do it like this so we don't waste space stringifying
				// the fields if they are not set
				if (body) {
					entry.body = body;
				}
				if (filePath) {
					if (filePath.startsWith('/')) {
						throw new Error(`File path must be relative to the site root. Got: ${filePath}`);
					}
					entry.filePath = filePath;
				}
				if (digest) {
					entry.digest = digest;
				}
				if (rendered) {
					entry.rendered = rendered;
				}

				this.set(collectionName, id, entry);
				return true;
			},
			delete: (key: string) => this.delete(collectionName, key),
			clear: () => this.clear(collectionName),
			has: (key: string) => this.has(collectionName, key),
			addAssetImport: (assetImport: string, fileName: string) =>
				this.addAssetImport(assetImport, fileName),
			addAssetImports: (assets: Array<string>, fileName: string) =>
				this.addAssetImports(assets, fileName),
		};
	}

	metaStore(collectionName: string): MetaStore {
		const collectionKey = `meta:${collectionName}`;
		return {
			get: (key: string) => this.get(collectionKey, key),
			set: (key: string, data: string) => this.set(collectionKey, key, data),
			delete: (key: string) => this.delete(collectionKey, key),
			has: (key: string) => this.has(collectionKey, key),
		};
	}

	toString() {
		return JSON.stringify(
			Array.from(this.#collections.entries()).map(([collectionName, collection]) => {
				return [collectionName, Array.from(collection.entries())];
			})
		);
	}

	async writeToDisk(filePath: PathLike) {
		if (!this.#dirty) {
			return;
		}
		try {
			await fs.writeFile(filePath, this.toString());
			this.#file = filePath;
			this.#dirty = false;
		} catch (err) {
			throw new AstroError({
				...(err as Error),
				...AstroErrorData.ContentLayerWriteError,
			});
		}
	}

	static async fromDisk(filePath: PathLike) {
		if (!existsSync(filePath)) {
			return new DataStore();
		}
		const str = await fs.readFile(filePath, 'utf-8');
		return DataStore.fromString(str);
	}

	static fromString(str: string) {
		const entries = JSON.parse(str);
		return DataStore.fromJSON(entries);
	}

	static async fromModule() {
		try {
			// @ts-expect-error
			const data = await import('astro:data-layer-content');
			return DataStore.fromJSON(data.default);
		} catch {}
		return new DataStore();
	}

	static fromJSON(entries: Array<[string, Array<[string, any]>]>) {
		const collections = new Map<string, Map<string, any>>();
		for (const [collectionName, collection] of entries) {
			collections.set(collectionName, new Map(collection));
		}
		const store = new DataStore();
		store.#collections = collections;
		return store;
	}
}

export interface ScopedDataStore {
	get: (key: string) => DataEntry | undefined;
	entries: () => Array<[id: string, DataEntry]>;
	/**
	 * Adds a new entry to the store. If an entry with the same ID already exists,
	 * it will be replaced.
	 * @param opts
	 * @param opts.id The ID of the entry. Must be unique per collection.
	 * @param opts.data The data to store.
	 * @param opts.body The raw body of the content, if applicable.
	 * @param opts.filePath The file path of the content, if applicable. Relative to the site root.
	 * @param opts.digest A content digest, to check if the content has changed.
	 * @param opts.rendered The rendered content, if applicable.
	 * @returns
	 */
	set: (opts: {
		id: string;
		data: Record<string, unknown>;
		body?: string;
		filePath?: string;
		digest?: number | string;
		rendered?: RenderedContent;
	}) => boolean;
	values: () => Array<DataEntry>;
	keys: () => Array<string>;
	delete: (key: string) => void;
	clear: () => void;
	has: (key: string) => boolean;
	/**
	 * Adds image etc assets to the store. These assets will be transformed
	 * by Vite, and the URLs will be available in the final build.
	 * @param assets An array of asset src values, relative to the importing file.
	 * @param fileName The full path of the file that is importing the assets.
	 */
	addAssetImports: (assets: Array<string>, fileName: string) => void;
	/**
	 * Adds a single asset to the store. This asset will be transformed
	 * by Vite, and the URL will be available in the final build.
	 * @param assetImport
	 * @param fileName
	 * @returns
	 */
	addAssetImport: (assetImport: string, fileName: string) => void;
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

function dataStoreSingleton() {
	let instance: Promise<DataStore> | DataStore | undefined = undefined;
	return {
		get: async () => {
			if (!instance) {
				instance = DataStore.fromModule();
			}
			return instance;
		},
		set: (store: DataStore) => {
			instance = store;
		},
	};
}

export const globalDataStore = dataStoreSingleton();
