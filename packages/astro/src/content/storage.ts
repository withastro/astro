import * as devalue from 'devalue';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import type { DataEntry } from './data-store.js';

/**
 * Describes the storage driver that keeps the entries of a build-time collection,
 * passed to the `storage` option of `defineCollection()`.
 *
 * The descriptor is written into the server bundle, so `config` must be JSON-serializable
 * and must not contain secrets.
 */
export interface CollectionStorageDescriptor<
	TConfig extends Record<string, unknown> = Record<string, unknown>,
> {
	/** URL or package specifier of a module whose default export creates the driver. */
	entrypoint: string | URL;
	/** Options passed to the driver factory. Must be JSON-serializable. */
	config?: TConfig;
}

/**
 * The default export of a storage driver's entrypoint. Astro calls it with the `config` of the
 * storage descriptor, once per process that writes or reads the collections using it.
 */
export type CollectionStorageDriverFactory<
	TConfig extends Record<string, unknown> = Record<string, unknown>,
> = (config: TConfig | undefined) => CollectionStorageDriver | Promise<CollectionStorageDriver>;

/**
 * Keeps the entries of build-time collections between sync and runtime.
 *
 * Each build writes its collections to a new snapshot, identified by a snapshot ID, and the
 * server it produces reads only that snapshot. A driver that writes its data inside the build
 * output can ignore the ID; a driver backed by a database shared between deployments must use
 * it to keep snapshots apart. A dev server writes a single snapshot, again after each change.
 *
 * Astro never deletes snapshots. Integrations can, with `listSnapshots()` and
 * `deleteSnapshot()`, in the `astro:build:done` hook.
 */
export interface CollectionStorageDriver {
	/**
	 * Returns the ID of the snapshot a build is about to write, for example a deployment ID.
	 * When omitted, Astro generates a random ID. Astro doesn't call it in development.
	 */
	createSnapshotId?(): string | Promise<string>;
	/**
	 * Opens a snapshot for writing, during sync. Builds open each snapshot once. A dev server
	 * opens its snapshot again after each change: the entries written then replace the
	 * snapshot's entries when the writer commits.
	 */
	openWriter(context: {
		snapshot: string;
		/** Whether `astro dev` writes the snapshot. `listSnapshots()` returns it. */
		dev: boolean;
	}): Promise<CollectionStorageWriter>;
	/** Opens a snapshot for reading. Astro only reads a snapshot after its writer committed it. */
	openReader(context: { snapshot: string }): Promise<CollectionStorageReader>;
	/** Returns the committed snapshots, in any order. */
	listSnapshots?(): Promise<CollectionStorageSnapshot[]>;
	/** Deletes a snapshot and its entries. */
	deleteSnapshot?(snapshot: string): Promise<void>;
}

/** A committed snapshot, as listed by `listSnapshots()`. */
export interface CollectionStorageSnapshot {
	snapshot: string;
	committedAt: Date;
	/** Whether `astro dev` wrote the snapshot. */
	dev: boolean;
}

export interface CollectionStorageWriter {
	/**
	 * Writes every entry of a collection. Astro calls it at most once per collection, and waits for
	 * it to resolve before writing the next collection.
	 */
	write(collection: string, entries: StoredEntry[]): Promise<void>;
	/**
	 * Makes the snapshot readable. A reader must not see any entry of the snapshot before
	 * `commit()` resolves, except in development, where a reader may see the snapshot while it is
	 * rewritten. Astro doesn't call `write()` after `commit()`.
	 */
	commit(): Promise<void>;
}

export interface CollectionStorageReader {
	/**
	 * Returns an entry, or `undefined` when the collection has no entry with this ID.
	 * When `options.content` is `false`, the entry may be returned without its `content`.
	 */
	get(
		collection: string,
		id: string,
		options: { content: boolean },
	): Promise<StoredEntry | undefined>;
	/**
	 * Returns every entry of a collection, in any order. When `options.content` is `false`,
	 * entries may be returned without their `content`.
	 */
	entries(collection: string, options: { content: boolean }): Promise<StoredEntry[]>;
}

/**
 * A collection entry as a storage driver keeps it. Astro serializes `metadata` and `content`,
 * and drivers store and return them unchanged.
 */
export interface StoredEntry {
	/** The entry ID, unique in its collection. */
	id: string;
	/** Every field of the entry except `body` and `rendered`. */
	metadata: string;
	/** The entry's `body` and `rendered` fields. Absent when the entry has neither. */
	content?: string;
}

type EntryMetadata = Omit<DataEntry, 'body' | 'rendered'>;
type EntryContent = Pick<DataEntry, 'body' | 'rendered'>;

/** Serializes an entry for a storage driver. {@link deserializeEntry} returns an equal entry. */
export function serializeEntry(entry: DataEntry): StoredEntry {
	const { body, rendered, ...metadata } = entry;
	const stored: StoredEntry = {
		id: entry.id,
		metadata: devalue.stringify(metadata satisfies EntryMetadata),
	};
	if (body !== undefined || rendered !== undefined) {
		const content: EntryContent = {};
		if (body !== undefined) content.body = body;
		if (rendered !== undefined) content.rendered = rendered;
		stored.content = devalue.stringify(content);
	}
	return stored;
}

/**
 * Deserializes an entry returned by a storage driver. The entry has no `body` or `rendered`
 * fields when `stored` has no `content`.
 */
export function deserializeEntry(stored: StoredEntry): DataEntry {
	const entry: DataEntry = devalue.parse(stored.metadata);
	if (stored.content !== undefined) {
		const content: EntryContent = devalue.parse(stored.content);
		if (content.body !== undefined) entry.body = content.body;
		if (content.rendered !== undefined) entry.rendered = content.rendered;
	}
	return entry;
}

/**
 * Validates the `storage` option of the collections in a content config.
 *
 * @throws {AstroError} `CollectionStorageDriversNotEnabled` when a collection sets `storage`
 * while `experimental.collectionStorageDrivers` is disabled.
 */
export function validateCollectionStorage(
	collections: Record<string, { type?: string; storage?: CollectionStorageDescriptor }>,
	enabled: boolean,
): void {
	if (enabled) return;
	for (const [name, collection] of Object.entries(collections)) {
		if (collection.storage) {
			throw new AstroError({
				...AstroErrorData.CollectionStorageDriversNotEnabled,
				message: AstroErrorData.CollectionStorageDriversNotEnabled.message(name),
			});
		}
	}
}
