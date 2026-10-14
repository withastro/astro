import { fileURLToPath } from 'node:url';
import type { RunnableDevEnvironment } from 'vite';
import { imageSrcToImportId } from '../assets/utils/resolveImports.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import type { AstroSettings } from '../types/astro.js';
import { createDataEntry } from './data-entry.js';
import type { DataEntry } from './data-store.js';
import {
	type ContentStorageDriver,
	type ContentStorageDriverFactory,
	deserializeEntry,
	serializeEntry,
} from './storage.js';
import { contentModuleToId } from './utils.js';

/**
 * Creates the store for the driver configured in `experimental.collectionStorage`, importing
 * the driver's `entrypoint` with `environment`. Returns `undefined` when no driver is configured.
 *
 * @throws {AstroError} `ContentStorageDriverNotFound` when the `entrypoint` can't be imported,
 * or when its default export isn't a function.
 */
export async function createExternalDataStore(
	settings: AstroSettings,
	environment: RunnableDevEnvironment,
): Promise<ExternalDataStore | undefined> {
	const storage = settings.config.experimental.collectionStorage;
	if (typeof storage !== 'object' || storage.type !== 'external' || !storage.driver) {
		return undefined;
	}
	const { entrypoint, config } = storage.driver;
	const specifier = entrypoint instanceof URL ? fileURLToPath(entrypoint) : entrypoint;
	const notFound = (cause?: unknown) =>
		new AstroError(
			{
				...AstroErrorData.ContentStorageDriverNotFound,
				message: AstroErrorData.ContentStorageDriverNotFound.message(specifier),
			},
			{ cause },
		);
	let createDriver: unknown;
	try {
		({ default: createDriver } = await environment.runner.import(specifier));
	} catch (error) {
		throw notFound(error);
	}
	if (typeof createDriver !== 'function') {
		throw notFound();
	}
	return new ExternalDataStore(await (createDriver as ContentStorageDriverFactory)(config));
}

/**
 * Gives loaders access to the collections defined with `storage: 'external'`,
 * which are saved by a {@link ContentStorageDriver} instead of being kept in memory.
 */
export class ExternalDataStore {
	#driver: ContentStorageDriver;
	#written = false;
	#writeListeners = new Set<() => void>();
	#flushListeners = new Set<() => void>();

	constructor(driver: ContentStorageDriver) {
		this.#driver = driver;
	}

	/**
	 * Registers a listener called after an entry is saved or removed.
	 * Returns a function that removes the listener.
	 */
	onWrite(listener: () => void): () => void {
		this.#writeListeners.add(listener);
		return () => {
			this.#writeListeners.delete(listener);
		};
	}

	/**
	 * Registers a listener called by {@link ExternalDataStore.flush} when entries were saved or
	 * removed since the previous flush. Returns a function that removes the listener.
	 */
	onFlush(listener: () => void): () => void {
		this.#flushListeners.add(listener);
		return () => {
			this.#flushListeners.delete(listener);
		};
	}

	#markWritten() {
		this.#written = true;
		for (const listener of this.#writeListeners) {
			listener();
		}
	}

	/**
	 * Saves the writes that the driver delayed. Then, if entries were saved or removed since
	 * the previous flush, calls the listeners registered with {@link ExternalDataStore.onFlush}.
	 */
	async flush() {
		const written = this.#written;
		this.#written = false;
		await this.#driver.flush?.();
		if (written) {
			for (const listener of this.#flushListeners) {
				listener();
			}
		}
	}

	/** Removes the entries and the meta values of the given collections. */
	async clearCollections(collectionNames: Iterable<string>) {
		for (const collectionName of collectionNames) {
			await this.#driver.clear(collectionName);
			await this.#driver.clearMeta(collectionName);
		}
		this.#markWritten();
	}

	async close() {
		await this.#driver.close?.();
	}

	/**
	 * Returns the import IDs of the images and of the deferred-render modules used by the
	 * entries of the given collections, for `MutableDataStore.setExternalImports()`.
	 */
	async collectImports(collectionNames: Iterable<string>) {
		const assetImports = new Set<string>();
		const moduleImports = new Map<string, string>();
		for (const collectionName of collectionNames) {
			for await (const entry of this.scopedStore(collectionName).values({ content: false })) {
				for (const assetImport of entry.assetImports ?? []) {
					const id = imageSrcToImportId(assetImport, entry.filePath);
					if (id) {
						assetImports.add(id);
					}
				}
				if (entry.deferredRender && entry.filePath) {
					const id = contentModuleToId(entry.filePath);
					if (id) {
						moduleImports.set(entry.filePath, id);
					}
				}
			}
		}
		return { assetImports, moduleImports };
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
				this.#markWritten();
				return true;
			},
			delete: async (key: string) => {
				await driver.delete(collectionName, String(key));
				this.#markWritten();
			},
			clear: async () => {
				await driver.clear(collectionName);
				this.#markWritten();
			},
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
