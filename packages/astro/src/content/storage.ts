import * as devalue from 'devalue';
import type { DataEntry } from './data-store.js';

/**
 * Configures the driver that persists content collections defined with
 * `storage: 'external'`.
 */
export interface ContentStorageDriverConfig<
	TConfig extends Record<string, any> = Record<string, any>,
> {
	/** URL or package import of a module whose default export creates the driver */
	entrypoint: string | URL;
	/** Serializable options passed to the driver factory */
	config?: TConfig;
}

/**
 * Creates a {@link ContentStorageDriver}. The module of a driver's `entrypoint` must export
 * it as default. It's called with the driver's `config`.
 */
export type ContentStorageDriverFactory<TConfig extends Record<string, any> = Record<string, any>> =
	(config: TConfig | undefined) => ContentStorageDriver | Promise<ContentStorageDriver>;

/**
 * A collection entry as it is saved by a {@link ContentStorageDriver}.
 *
 * Astro serializes the entry into two strings, which drivers save and return as they are.
 * Keeping the entry's body and rendered HTML in `content` lets a driver read entries
 * without them.
 */
export interface SerializedEntry {
	/** The entry ID, unique in its collection */
	id: string;
	/** All the entry fields, except `body` and `rendered` */
	metadata: string;
	/** The entry's `body` and `rendered` fields. Missing when the entry has neither. */
	content?: string;
}

/**
 * Saves and reads collections defined with `storage: 'external'`.
 *
 * Once a write finishes, reads must return the written data. A driver may delay saving
 * writes until {@link ContentStorageDriver.flush} is called, but it must still return
 * them when they're read.
 */
export interface ContentStorageDriver {
	/** Returns whether the collection has at least one entry. */
	hasCollection(collection: string): Promise<boolean>;
	/** Returns an entry. When `options.content` is `false`, the entry can be returned without its `content`. */
	get(
		collection: string,
		id: string,
		options: { content: boolean },
	): Promise<SerializedEntry | undefined>;
	/** Returns the IDs of all the entries of a collection. */
	keys(collection: string): Promise<string[]>;
	/**
	 * Returns all the entries of a collection, in any order. When `options.content` is `false`,
	 * entries can be returned without their `content`.
	 */
	values(
		collection: string,
		options: { content: boolean },
	): Promise<SerializedEntry[]> | AsyncIterable<SerializedEntry>;
	/** Saves an entry, replacing the entry with the same ID. */
	set(collection: string, entry: SerializedEntry): Promise<void>;
	/** Removes an entry. Does nothing if the entry doesn't exist. */
	delete(collection: string, id: string): Promise<void>;
	/** Removes all the entries of a collection. The values saved with `setMeta()` are kept. */
	clear(collection: string): Promise<void>;
	/** Returns the value saved under `key` with `setMeta()`. */
	getMeta(collection: string, key: string): Promise<string | undefined>;
	/** Saves a value under `key`, replacing the previous one. Loaders call it through `context.meta.set()`. */
	setMeta(collection: string, key: string, value: string): Promise<void>;
	/** Removes the value saved under `key`. Does nothing if there's none. */
	deleteMeta(collection: string, key: string): Promise<void>;
	/** Removes all the values saved with `setMeta()` for the collection. */
	clearMeta(collection: string): Promise<void>;
	/** Saves the writes that the driver delayed. */
	flush?(): Promise<void>;
	/** Releases what the driver holds, such as database connections. Astro calls it once it no longer uses the driver. */
	close?(): Promise<void>;
}

/** The entry fields serialized in {@link SerializedEntry.metadata} */
type EntryMetadata = Omit<DataEntry, 'body' | 'rendered'>;

/** The entry fields serialized in {@link SerializedEntry.content} */
interface EntryContent {
	body?: DataEntry['body'];
	rendered?: DataEntry['rendered'];
}

/**
 * Serializes an entry for a {@link ContentStorageDriver}. {@link deserializeEntry} returns the same entry.
 */
export function serializeEntry(entry: DataEntry): SerializedEntry {
	const { body, rendered, ...fields } = entry;
	const metadata: EntryMetadata = fields;
	const serialized: SerializedEntry = { id: entry.id, metadata: devalue.stringify(metadata) };
	if (body !== undefined || rendered !== undefined) {
		const content: EntryContent = {};
		if (body !== undefined) {
			content.body = body;
		}
		if (rendered !== undefined) {
			content.rendered = rendered;
		}
		serialized.content = devalue.stringify(content);
	}
	return serialized;
}

/**
 * Deserializes an entry returned by a {@link ContentStorageDriver}. The entry has no `body` or
 * `rendered` fields when `serialized` has no `content`.
 */
export function deserializeEntry(serialized: SerializedEntry): DataEntry {
	const metadata: EntryMetadata = devalue.parse(serialized.metadata);
	const entry: DataEntry = metadata;
	if (serialized.content !== undefined) {
		const content: EntryContent = devalue.parse(serialized.content);
		if (content.body !== undefined) {
			entry.body = content.body;
		}
		if (content.rendered !== undefined) {
			entry.rendered = content.rendered;
		}
	}
	return entry;
}
