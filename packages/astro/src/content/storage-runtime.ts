import type { DataEntry } from './data-store.js';
import {
	type DataStoreSource,
	type ReadEntryOptions,
	withoutContent,
} from './data-store-source.js';
import {
	type CollectionStorageDriverFactory,
	type CollectionStorageReader,
	deserializeEntry,
	type StoredEntry,
} from './storage.js';
import type { StoredSnapshot } from './storage-sync.js';

/** A storage driver bundled with the server, and the snapshot its build wrote. */
export interface BundledStorageDriver extends Omit<StoredSnapshot, 'entrypoint'> {
	createDriver: CollectionStorageDriverFactory;
}

/**
 * A {@link import('./data-store-source.js').DataStoreSource} that reads collections from
 * the snapshot their build wrote with their storage driver. Each driver and its reader are
 * created on the first read of one of its collections, then reused.
 */
export class StoredCollectionsSource implements DataStoreSource {
	#drivers = new Map<string, BundledStorageDriver>();
	#readers = new Map<BundledStorageDriver, Promise<CollectionStorageReader>>();

	constructor(drivers: BundledStorageDriver[]) {
		for (const driver of drivers) {
			for (const collection of driver.collections) {
				this.#drivers.set(collection, driver);
			}
		}
	}

	#reader(collection: string): Promise<CollectionStorageReader> {
		const driver = this.#drivers.get(collection)!;
		let reader = this.#readers.get(driver);
		if (!reader) {
			reader = (async () => {
				const instance = await driver.createDriver(driver.config);
				return instance.openReader({ snapshot: driver.snapshot });
			})();
			this.#readers.set(driver, reader);
			// Retry on the next read instead of caching the failure
			reader.catch(() => this.#readers.delete(driver));
		}
		return reader;
	}

	hasCollection(collection: string): boolean {
		return this.#drivers.has(collection);
	}

	async get(
		collection: string,
		key: string,
		options?: ReadEntryOptions,
	): Promise<DataEntry | undefined> {
		const reader = await this.#reader(collection);
		const stored = await reader.get(collection, key, { content: options?.content !== false });
		if (!stored) return undefined;
		return this.#deserialize(stored, options);
	}

	async values(collection: string, options?: ReadEntryOptions): Promise<DataEntry[]> {
		const reader = await this.#reader(collection);
		const stored = await reader.entries(collection, { content: options?.content !== false });
		return stored.map((entry) => this.#deserialize(entry, options));
	}

	#deserialize(stored: StoredEntry, options?: ReadEntryOptions): DataEntry {
		const entry = deserializeEntry(stored);
		// A driver may return the content even when it isn't requested
		return options?.content === false ? withoutContent(entry) : entry;
	}
}
