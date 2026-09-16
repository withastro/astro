import type { DataEntry, ImmutableDataStore } from './data-store.js';

/**
 * A read-only, async view over content collection data, used at runtime by
 * `getCollection()` and `getEntry()`. It lets the runtime read from different
 * embedded and adapter-provided data sources through one interface, without
 * depending on Node.js APIs.
 *
 * The query methods are async so a source can perform I/O when resolving data.
 * The default {@link InMemorySource} resolves synchronously.
 */
export interface DataStoreSource {
	hasCollection(collection: string): Promise<boolean> | boolean;
	get(collection: string, key: string): Promise<DataEntry | undefined> | DataEntry | undefined;
	values(collection: string): Promise<DataEntry[]> | DataEntry[];
}

export type DataStoreSourceFactory<
	TConfig extends Record<string, unknown> = Record<string, unknown>,
> = (config: TConfig | undefined) => DataStoreSource | Promise<DataStoreSource>;

export interface DataStoreSourceRegistry {
	config: Record<string, unknown> | undefined;
	load: () => Promise<DataStoreSourceFactory>;
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

	hasCollection(collection: string): boolean {
		return this.#store.hasCollection(collection);
	}

	get(collection: string, key: string): DataEntry | undefined {
		return this.#store.get(collection, key);
	}

	values(collection: string): DataEntry[] {
		return this.#store.values(collection);
	}
}
