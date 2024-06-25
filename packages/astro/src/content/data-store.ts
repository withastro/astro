import { promises as fs, type PathLike, existsSync } from 'fs';
export class DataStore {
	#collections = new Map<string, Map<string, any>>();
	constructor() {
		this.#collections = new Map();
	}
	get(collectionName: string, key: string) {
		return this.#collections.get(collectionName)?.get(key);
	}
	entries(collectionName: string): IterableIterator<[id: string, any]> {
		const collection = this.#collections.get(collectionName) ?? new Map();
		return collection.entries();
	}
	set(collectionName: string, key: string, value: any) {
		const collection = this.#collections.get(collectionName) ?? new Map();
		collection.set(key, value);
		this.#collections.set(collectionName, collection);
	}
	delete(collectionName: string, key: string) {
		const collection = this.#collections.get(collectionName);
		if (collection) {
			collection.delete(key);
		}
	}
	clear(collectionName: string) {
		this.#collections.delete(collectionName);
	}

	has(collectionName: string, key: string) {
		const collection = this.#collections.get(collectionName);
		if (collection) {
			return collection.has(key);
		}
		return false;
	}

	hasCollection(collectionName: string) {
		return this.#collections.has(collectionName);
	}

	collections() {
		return this.#collections;
	}

	scopedStore(collectionName: string): ScopedDataStore {
		return {
			get: (key: string) => this.get(collectionName, key),
			entries: () => this.entries(collectionName),
			set: (key: string, value: any) => this.set(collectionName, key, value),
			delete: (key: string) => this.delete(collectionName, key),
			clear: () => this.clear(collectionName),
			has: (key: string) => this.has(collectionName, key),
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
		await fs.writeFile(filePath, this.toString());
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
	get: (key: string) => any;
	entries: () => IterableIterator<[id: string, any]>;
	set: (key: string, value: any) => void;
	delete: (key: string) => void;
	clear: () => void;
	has: (key: string) => boolean;
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
