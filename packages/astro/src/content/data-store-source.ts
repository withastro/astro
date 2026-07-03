import type { DataEntry, ImmutableDataStore } from './data-store.js';

/**
 * A read-only, async view over content collection data, used at runtime by
 * `getCollection()` and `getEntry()`. This is the consumer-side seam that lets
 * the runtime read from different backends (an in-memory snapshot today,
 * potentially a database or remote source in the future) without depending on
 * Node.js APIs.
 *
 * The query methods are async so a backend can perform I/O when resolving data.
 * The default {@link InMemorySource} resolves synchronously.
 */
export interface DataStoreSource {
	hasCollection(collection: string): Promise<boolean>;
	get<T = DataEntry>(collection: string, key: string): Promise<T | undefined>;
	entries<T = DataEntry>(collection: string): Promise<Array<[id: string, T]>>;
	values<T = DataEntry>(collection: string): Promise<Array<T>>;
	keys(collection: string): Promise<Array<string>>;
	has(collection: string, key: string): Promise<boolean>;
	collections(): Promise<Map<string, Map<string, any>>>;
}

/**
 * A {@link DataStoreSource} backed by an in-memory {@link ImmutableDataStore}.
 * All queries resolve synchronously; the async signatures exist to satisfy the
 * {@link DataStoreSource} contract.
 */
export class InMemorySource implements DataStoreSource {
	#store: ImmutableDataStore;

	constructor(store: ImmutableDataStore) {
		this.#store = store;
	}

	async hasCollection(collection: string): Promise<boolean> {
		return this.#store.hasCollection(collection);
	}

	async get<T = DataEntry>(collection: string, key: string): Promise<T | undefined> {
		return this.#store.get<T>(collection, key);
	}

	async entries<T = DataEntry>(collection: string): Promise<Array<[id: string, T]>> {
		return this.#store.entries<T>(collection);
	}

	async values<T = DataEntry>(collection: string): Promise<Array<T>> {
		return this.#store.values<T>(collection);
	}

	async keys(collection: string): Promise<Array<string>> {
		return this.#store.keys(collection);
	}

	async has(collection: string, key: string): Promise<boolean> {
		return this.#store.has(collection, key);
	}

	async collections(): Promise<Map<string, Map<string, any>>> {
		return this.#store.collections();
	}
}
