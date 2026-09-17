import { promises as fs } from 'node:fs';
import type { AstroConfig } from 'astro';
import * as devalue from 'devalue';

/** An entry as persisted by the content layer. Mirrors astro's internal `DataEntry`. */
export interface StoredEntry {
	id: string;
	data: Record<string, unknown>;
	filePath?: string;
	body?: string;
	digest?: number | string;
	rendered?: { html: string; metadata?: Record<string, unknown> };
}

export type StoredCollections = Map<string, Map<string, StoredEntry>>;

export interface DataStorePaths {
	/** The file whose write commits a store update: the store itself, or the manifest of a chunked store. */
	commitFile: URL;
	chunked: boolean;
}

/**
 * Where the content layer persists its data store. Development keeps it in
 * `.astro/` so the file watcher can see it, builds keep it in the cache directory.
 * This mirrors astro's internal `getDataStoreFile()`/`getDataStoreDir()`.
 */
export function getDataStorePaths(config: AstroConfig, isDev: boolean): DataStorePaths {
	const base = isDev ? new URL('.astro/', config.root) : config.cacheDir;
	const storage = config.experimental?.collectionStorage;
	const chunked = storage !== undefined && storage !== 'single-file';
	return chunked
		? { commitFile: new URL('data-store/manifest.json', base), chunked }
		: { commitFile: new URL('data-store.json', base), chunked };
}

/** Reads the whole data store from disk. Resolves with an empty map if it has not been written yet. */
export async function readDataStore(paths: DataStorePaths): Promise<StoredCollections> {
	let text: string;
	try {
		text = await fs.readFile(paths.commitFile, 'utf-8');
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return new Map();
		throw error;
	}
	if (!paths.chunked) {
		const parsed = devalue.parse(text);
		return parsed instanceof Map ? onlyContentCollections(parsed) : new Map();
	}
	const manifest = JSON.parse(text) as Record<string, string[]>;
	const collections: StoredCollections = new Map();
	for (const [collection, parts] of Object.entries(manifest)) {
		const entries = new Map<string, StoredEntry>();
		const contents = await Promise.all(
			parts.map((part) => fs.readFile(new URL(`./${part}`, paths.commitFile), 'utf-8')),
		);
		for (const record of contents.join('').split('\n')) {
			if (!record) continue;
			const [id, entry] = devalue.parse(record) as [string, StoredEntry];
			entries.set(id, entry);
		}
		collections.set(collection, entries);
	}
	return onlyContentCollections(collections);
}

/**
 * The store also holds the loaders' key-value meta stores, under `meta:<collection>`
 * collections whose values are plain strings. Only real entries are mirrored.
 */
function onlyContentCollections(collections: StoredCollections): StoredCollections {
	const result: StoredCollections = new Map();
	for (const [name, entries] of collections) {
		if (name.startsWith('meta:')) continue;
		const filtered = new Map<string, StoredEntry>();
		for (const [id, entry] of entries) {
			if (entry && typeof entry === 'object' && typeof entry.data === 'object' && entry.data) {
				filtered.set(id, entry);
			}
		}
		result.set(name, filtered);
	}
	return result;
}
