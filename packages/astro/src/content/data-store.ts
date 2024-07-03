import { promises as fs, type PathLike, existsSync } from 'fs';

const SAVE_DEBOUNCE_MS = 500;

export interface DataEntry {
	id: string;
	data: Record<string, unknown>;
	filePath?: string;
	body?: string;
}

export class DataStore {
	#collections = new Map<string, Map<string, any>>();

	#file?: PathLike;

	#saveTimeout: NodeJS.Timeout | undefined;

	#dirty = false;

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

	#saveToDiskDebounced = () => {
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
	};

	scopedStore(collectionName: string): ScopedDataStore {
		return {
			get: (key: string) => this.get<DataEntry>(collectionName, key),
			entries: () => this.entries(collectionName),
			values: () => this.values(collectionName),
			keys: () => this.keys(collectionName),
			set: (key, data, body, filePath) => {
				if (!key) {
					throw new Error(`Key must be a non-empty string`);
				}
				const id = String(key);
				const entry: DataEntry = {
					id,
					data,
				};
				// We do it like this so we don't waste space stringifying
				// the body and filePath if they are not set
				if (body) {
					entry.body = body;
				}
				if (filePath) {
					entry.filePath = filePath;
				}

				this.set(collectionName, id, entry);
			},
			delete: (key: string) => this.delete(collectionName, key),
			clear: () => this.clear(collectionName),
			has: (key: string) => this.has(collectionName, key),
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
		} catch {
			throw new Error(`Failed to save data store to disk`);
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
	set: (key: string, data: Record<string, unknown>, body?: string, filePath?: string) => void;
	values: () => Array<DataEntry>;
	keys: () => Array<string>;
	delete: (key: string) => void;
	clear: () => void;
	has: (key: string) => boolean;
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
