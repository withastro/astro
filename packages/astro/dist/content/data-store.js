import * as devalue from 'devalue';
class ImmutableDataStore {
	_collections = /* @__PURE__ */ new Map();
	constructor() {
		this._collections = /* @__PURE__ */ new Map();
	}
	get(collectionName, key) {
		return this._collections.get(collectionName)?.get(String(key));
	}
	entries(collectionName) {
		const collection = this._collections.get(collectionName) ?? /* @__PURE__ */ new Map();
		return [...collection.entries()];
	}
	values(collectionName) {
		const collection = this._collections.get(collectionName) ?? /* @__PURE__ */ new Map();
		return [...collection.values()];
	}
	keys(collectionName) {
		const collection = this._collections.get(collectionName) ?? /* @__PURE__ */ new Map();
		return [...collection.keys()];
	}
	has(collectionName, key) {
		const collection = this._collections.get(collectionName);
		if (collection) {
			return collection.has(String(key));
		}
		return false;
	}
	hasCollection(collectionName) {
		return this._collections.has(collectionName);
	}
	collections() {
		return this._collections;
	}
	/**
	 * Attempts to load a DataStore from the virtual module.
	 * This only works in Vite.
	 */
	static async fromModule() {
		try {
			const data = await import('astro:data-layer-content');
			if (data.default instanceof Map) {
				return ImmutableDataStore.fromMap(data.default);
			}
			const map = devalue.unflatten(data.default);
			return ImmutableDataStore.fromMap(map);
		} catch {}
		return new ImmutableDataStore();
	}
	static async fromMap(data) {
		const store = new ImmutableDataStore();
		store._collections = data;
		return store;
	}
}
function dataStoreSingleton() {
	let instance = void 0;
	return {
		get: async () => {
			if (!instance) {
				instance = ImmutableDataStore.fromModule();
			}
			return instance;
		},
		set: (store) => {
			instance = store;
		},
	};
}
const globalDataStore = dataStoreSingleton();
export { ImmutableDataStore, globalDataStore };
