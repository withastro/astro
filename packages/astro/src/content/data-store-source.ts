import type { DataEntry, ImmutableDataStore } from './data-store.js';
import { type ContentStorageDriver, deserializeEntry } from './storage.js';

/**
 * A read-only, async view over content collection data, used at runtime by
 * `getCollection()` and `getEntry()`. It lets the runtime read from different
 * data sources (an in-memory snapshot, or a {@link ContentStorageDriver} for
 * collections defined with `storage: 'external'`) through one interface,
 * without depending on Node.js APIs.
 *
 * The query methods are async so a source can perform I/O when resolving data.
 * The default {@link InMemorySource} resolves synchronously.
 */
export interface DataStoreSource {
	hasCollection(collection: string): Promise<boolean> | boolean;
	get<T = DataEntry>(collection: string, key: string): Promise<T | undefined> | T | undefined;
	entries<T = DataEntry>(
		collection: string,
	): Promise<Array<[id: string, T]>> | Array<[id: string, T]>;
	values<T = DataEntry>(collection: string): Promise<Array<T>> | Array<T>;
	/** Returns the entries of a collection without their `body` and `rendered` fields. */
	metadata<T = DataEntry>(collection: string): Promise<Array<T>> | Array<T>;
	keys(collection: string): Promise<Array<string>> | Array<string>;
	has(collection: string, key: string): Promise<boolean> | boolean;
	collections(): Promise<Map<string, Map<string, any>>> | Map<string, Map<string, any>>;
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

	get<T = DataEntry>(collection: string, key: string): T | undefined {
		return this.#store.get<T>(collection, key);
	}

	entries<T = DataEntry>(collection: string): Array<[id: string, T]> {
		return this.#store.entries<T>(collection);
	}

	values<T = DataEntry>(collection: string): Array<T> {
		return this.#store.values<T>(collection);
	}

	metadata<T = DataEntry>(collection: string): Array<T> {
		return this.#store
			.values<DataEntry>(collection)
			.map(({ body: _body, rendered: _rendered, ...entry }) => entry as T);
	}

	keys(collection: string): Array<string> {
		return this.#store.keys(collection);
	}

	has(collection: string, key: string): boolean {
		return this.#store.has(collection, key);
	}

	collections(): Map<string, Map<string, any>> {
		return this.#store.collections();
	}
}

/**
 * Reads the collections that a {@link ContentStorageDriver} saves. Every query asks the
 * driver, so it returns what the driver holds at that moment.
 */
export class ExternalSource implements Omit<DataStoreSource, 'collections'> {
	#driver: ContentStorageDriver;

	constructor(driver: ContentStorageDriver) {
		this.#driver = driver;
	}

	hasCollection(collection: string): Promise<boolean> {
		return this.#driver.hasCollection(collection);
	}

	async get<T = DataEntry>(collection: string, key: string): Promise<T | undefined> {
		const entry = await this.#driver.get(collection, String(key), { content: true });
		return entry && (deserializeEntry(entry) as T);
	}

	async entries<T = DataEntry>(collection: string): Promise<Array<[id: string, T]>> {
		const values = await this.#read(collection, true);
		return values.map((entry) => [entry.id, entry as T]);
	}

	async values<T = DataEntry>(collection: string): Promise<Array<T>> {
		return (await this.#read(collection, true)) as Array<T>;
	}

	async metadata<T = DataEntry>(collection: string): Promise<Array<T>> {
		return (await this.#read(collection, false)) as Array<T>;
	}

	keys(collection: string): Promise<Array<string>> {
		return this.#driver.keys(collection);
	}

	async has(collection: string, key: string): Promise<boolean> {
		return (await this.#driver.get(collection, String(key), { content: false })) !== undefined;
	}

	async #read(collection: string, content: boolean): Promise<Array<DataEntry>> {
		const entries: Array<DataEntry> = [];
		for await (const entry of await this.#driver.values(collection, { content })) {
			entries.push(deserializeEntry(entry));
		}
		return entries;
	}
}

/**
 * A {@link DataStoreSource} that reads the collections defined with `storage: 'external'`
 * from an {@link ExternalSource}, and the other collections from the in-memory source.
 */
export class CompositeSource implements DataStoreSource {
	#memory: DataStoreSource;
	#external: ExternalSource;
	#externalCollections: Set<string>;

	constructor(
		memory: DataStoreSource,
		external: ExternalSource,
		externalCollections: Iterable<string>,
	) {
		this.#memory = memory;
		this.#external = external;
		this.#externalCollections = new Set(externalCollections);
	}

	#source(collection: string): Omit<DataStoreSource, 'collections'> {
		return this.#externalCollections.has(collection) ? this.#external : this.#memory;
	}

	hasCollection(collection: string) {
		return this.#source(collection).hasCollection(collection);
	}

	get<T = DataEntry>(collection: string, key: string) {
		return this.#source(collection).get<T>(collection, key);
	}

	entries<T = DataEntry>(collection: string) {
		return this.#source(collection).entries<T>(collection);
	}

	values<T = DataEntry>(collection: string) {
		return this.#source(collection).values<T>(collection);
	}

	metadata<T = DataEntry>(collection: string) {
		return this.#source(collection).metadata<T>(collection);
	}

	keys(collection: string) {
		return this.#source(collection).keys(collection);
	}

	has(collection: string, key: string) {
		return this.#source(collection).has(collection, key);
	}

	/** Returns the in-memory collections. The collections saved by the driver aren't included. */
	collections() {
		return this.#memory.collections();
	}
}
