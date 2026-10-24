import { createDataEntry } from './data-entry.js';
import type { DataEntry } from './data-store.js';
import { type ContentStorageDriver, deserializeEntry, serializeEntry } from './storage.js';

/**
 * Gives loaders access to the collections defined with `storage: 'external'`,
 * which are saved by a {@link ContentStorageDriver} instead of being kept in memory.
 */
export class ExternalDataStore {
	#driver: ContentStorageDriver;

	constructor(driver: ContentStorageDriver) {
		this.#driver = driver;
	}

	scopedStore(collectionName: string): AsyncDataStore {
		const driver = this.#driver;
		async function* values(options?: ReadEntryOptions) {
			const serialized = await driver.values(collectionName, {
				content: options?.content ?? true,
			});
			for await (const entry of serialized) {
				yield deserializeEntry(entry);
			}
		}
		return {
			get: async <TData extends Record<string, unknown> = Record<string, unknown>>(
				key: string,
				options?: ReadEntryOptions,
			) => {
				const serialized = await driver.get(collectionName, String(key), {
					content: options?.content ?? true,
				});
				return serialized && (deserializeEntry(serialized) as DataEntry<TData>);
			},
			entries: async function* (options?: ReadEntryOptions) {
				for await (const entry of values(options)) {
					yield [entry.id, entry];
				}
			},
			values,
			keys: () => driver.keys(collectionName),
			set: async (input) => {
				if (!input.id) {
					throw new Error(`ID must be a non-empty string`);
				}
				const id = String(input.id);
				if (input.digest) {
					const existing = await driver.get(collectionName, id, { content: false });
					if (existing && deserializeEntry(existing).digest === input.digest) {
						return false;
					}
				}
				await driver.set(collectionName, serializeEntry(createDataEntry(id, input)));
				return true;
			},
			delete: (key: string) => driver.delete(collectionName, String(key)),
			clear: () => driver.clear(collectionName),
			has: async (key: string) =>
				(await driver.get(collectionName, String(key), { content: false })) !== undefined,
		};
	}

	metaStore(collectionName: string): AsyncMetaStore {
		const driver = this.#driver;
		return {
			get: (key: string) => driver.getMeta(collectionName, key),
			set: (key: string, value: string) => driver.setMeta(collectionName, key, value),
			delete: (key: string) => driver.deleteMeta(collectionName, key),
			has: async (key: string) => (await driver.getMeta(collectionName, key)) !== undefined,
		};
	}
}

export interface ReadEntryOptions {
	/**
	 * Set to `false` to read entries without their `body` and `rendered` fields,
	 * which are usually the largest. Defaults to `true`.
	 */
	content?: boolean;
}

/**
 * The store of a collection defined with `storage: 'external'`. Loaders receive it as `context.store`.
 * It has the same methods as the store of other collections, but they return promises.
 */
export interface AsyncDataStore {
	get: <TData extends Record<string, unknown> = Record<string, unknown>>(
		key: string,
		options?: ReadEntryOptions,
	) => Promise<DataEntry<TData> | undefined>;
	entries: (options?: ReadEntryOptions) => AsyncIterable<[id: string, DataEntry]>;
	/**
	 * Saves an entry, replacing the entry with the same ID. Resolves to `false` without saving
	 * when the saved entry has the same `digest`.
	 */
	set: <TData extends Record<string, unknown>>(opts: DataEntry<TData>) => Promise<boolean>;
	values: (options?: ReadEntryOptions) => AsyncIterable<DataEntry>;
	keys: () => Promise<Array<string>>;
	delete: (key: string) => Promise<void>;
	clear: () => Promise<void>;
	has: (key: string) => Promise<boolean>;
}

/**
 * Saves strings that a loader keeps between syncs of a collection defined with
 * `storage: 'external'`, such as the time of its last sync, so it can load only what
 * changed since. Loaders receive it as `context.meta`.
 */
export interface AsyncMetaStore {
	get: (key: string) => Promise<string | undefined>;
	set: (key: string, value: string) => Promise<void>;
	has: (key: string) => Promise<boolean>;
	delete: (key: string) => Promise<void>;
}
