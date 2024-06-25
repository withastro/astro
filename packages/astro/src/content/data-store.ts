export class DataStore {
	#collections = new Map<string, Map<string, any>>();
	constructor() {
		this.#collections = new Map();
	}
	get(collectionName: string) {
		return this.#collections.get(collectionName);
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

	scopedStore(collectionName: string): ScopedDataStore {
		return {
			get: (key: string) => this.get(collectionName)?.get(key),
			entries: () => this.entries(collectionName),
			set: (key: string, value: any) => this.set(collectionName, key, value),
			delete: (key: string) => this.delete(collectionName, key),
			clear: () => this.clear(collectionName),
			has: (key: string) => this.has(collectionName, key),
		};
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
	let instance: DataStore | undefined = undefined;
	return {
		get: () => {
			if (!instance) {
				instance = new DataStore();
			}
			return instance;
		},
		set: (store: DataStore) => {
			instance = store;
		},
	};
}

export const globalDataStore = dataStoreSingleton();
