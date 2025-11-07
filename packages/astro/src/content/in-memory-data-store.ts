import { Traverse } from 'neotraverse/modern';
import { IMAGE_IMPORT_PREFIX } from './consts.js';
import type { DataEntry } from './data-store.js';
import type { DataStore } from './mutable-data-store.js';

export class InMemoryDataStore implements DataStore {
	#collection: Map<string, any>;
	#events: Array<
		| {
				type: 'set';
				entry: DataEntry;
		  }
		| {
				type: 'delete';
				key: string;
		  }
		| {
				type: 'clear';
		  }
		| {
				type: 'addAssetImport';
				assetImport: string;
				filePath: string;
		  }
		| {
				type: 'addAssetImports';
				assets: Array<string>;
				filePath: string;
		  }
		| {
				type: 'addModuleImport';
				filePath: string;
		  }
	> = [];

	constructor(collection: Map<string, any>) {
		this.#collection = collection;
	}

	get events() {
		return this.#events;
	}

	get<TData extends Record<string, unknown> = Record<string, unknown>>(
		key: string,
	): DataEntry<TData> {
		return this.#collection.get(key);
	}

	entries() {
		return [...this.#collection.entries()];
	}

	values() {
		return [...this.#collection.values()];
	}

	keys() {
		return [...this.#collection.keys()];
	}

	set<TData extends Record<string, unknown>>(inputEntry: DataEntry<TData>) {
		this.#events.push({
			type: 'set',
			entry: inputEntry,
		});
		const {
			id: key,
			data,
			body,
			filePath,
			deferredRender,
			digest,
			rendered,
			assetImports,
		} = inputEntry;
		if (!key) {
			throw new Error(`ID must be a non-empty string`);
		}
		const id = String(key);
		if (digest) {
			const existing = this.#collection.get(id) as DataEntry | undefined;
			if (existing && existing.digest === digest) {
				return false;
			}
		}
		const foundAssets = new Set<string>(assetImports);
		// Check for image imports in the data. These will have been prefixed during schema parsing
		new Traverse(data).forEach((_, val) => {
			if (typeof val === 'string' && val.startsWith(IMAGE_IMPORT_PREFIX)) {
				const src = val.replace(IMAGE_IMPORT_PREFIX, '');
				foundAssets.add(src);
			}
		});

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

		if (foundAssets.size) {
			entry.assetImports = Array.from(foundAssets);
		}

		if (digest) {
			entry.digest = digest;
		}
		if (rendered) {
			entry.rendered = rendered;
		}
		if (deferredRender) {
			entry.deferredRender = deferredRender;
		}
		this.#collection.set(id, entry);
		return true;
	}

	delete(key: string) {
		this.#events.push({
			type: 'delete',
			key,
		});
		return this.#collection.delete(key);
	}

	clear() {
		this.#collection = new Map();
	}

	has(key: string) {
		return this.#collection.has(key);
	}

	addAssetImport(assetImport: string, filePath: string) {
		this.#events.push({
			type: 'addAssetImport',
			assetImport,
			filePath,
		});
	}

	addAssetImports(assets: Array<string>, filePath: string) {
		this.#events.push({
			type: 'addAssetImports',
			assets,
			filePath,
		});
	}

	addModuleImport(filePath: string) {
		this.#events.push({
			type: 'addModuleImport',
			filePath,
		});
	}
}
