import type { DataEntry, ImmutableDataStore } from './data-store.js';

export interface ReadEntryOptions {
	/** When `false`, entries are returned without `body` and `rendered`. Defaults to `true`. */
	content?: boolean;
}

/**
 * A read-only, async view over content collection data, used at runtime by
 * `getCollection()` and `getEntry()`. It lets the runtime read from different
 * data sources (the bundled data store, or collection storage drivers) through
 * one interface, without depending on Node.js APIs.
 *
 * The query methods are async so a source can perform I/O when resolving data.
 * The default {@link InMemorySource} resolves synchronously.
 */
export interface DataStoreSource {
	hasCollection(collection: string): Promise<boolean> | boolean;
	get(
		collection: string,
		key: string,
		options?: ReadEntryOptions,
	): Promise<DataEntry | undefined> | DataEntry | undefined;
	values(collection: string, options?: ReadEntryOptions): Promise<DataEntry[]> | DataEntry[];
}

/** Returns a copy of an entry without `body` and `rendered`. */
export function withoutContent({
	body: _body,
	rendered: _rendered,
	...entry
}: DataEntry): DataEntry {
	return entry;
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

	get(collection: string, key: string, options?: ReadEntryOptions): DataEntry | undefined {
		const entry = this.#store.get<DataEntry>(collection, key);
		return entry && options?.content === false ? withoutContent(entry) : entry;
	}

	values(collection: string, options?: ReadEntryOptions): DataEntry[] {
		const entries = this.#store.values<DataEntry>(collection);
		return options?.content === false ? entries.map(withoutContent) : entries;
	}
}

/**
 * Reads collections listed in `stored` from `storedSource`, and every other
 * collection from `bundledSource`.
 */
export class CompositeSource implements DataStoreSource {
	#bundledSource: DataStoreSource;
	#storedSource: DataStoreSource;
	#stored: Set<string>;

	constructor(bundledSource: DataStoreSource, storedSource: DataStoreSource, stored: Set<string>) {
		this.#bundledSource = bundledSource;
		this.#storedSource = storedSource;
		this.#stored = stored;
	}

	#source(collection: string) {
		return this.#stored.has(collection) ? this.#storedSource : this.#bundledSource;
	}

	hasCollection(collection: string) {
		return this.#source(collection).hasCollection(collection);
	}

	get(collection: string, key: string, options?: ReadEntryOptions) {
		return this.#source(collection).get(collection, key, options);
	}

	values(collection: string, options?: ReadEntryOptions) {
		return this.#source(collection).values(collection, options);
	}
}
