import type { MarkdownHeading } from '@astrojs/internal-helpers/markdown';
import * as devalue from 'devalue';
import { type DataStoreSource, InMemorySource } from './data-store-source.js';

export interface RenderedContent {
	/** Rendered HTML string. If present then `render(entry)` will return a component that renders this HTML. */
	html: string;
	metadata?: {
		/** Any images that are present in this entry. Relative to the {@link DataEntry} filePath. */
		imagePaths?: Array<string>;
		/** Any headings that are present in this file. */
		headings?: MarkdownHeading[];
		/** Raw frontmatter, parsed from the file. This may include data from remark plugins. */
		frontmatter?: Record<string, any>;
		/** Any other metadata that is present in this file. */
		[key: string]: unknown;
	};
}

export interface DataEntry<TData extends Record<string, unknown> = Record<string, unknown>> {
	/** The ID of the entry. Unique per collection. */
	id: string;
	/** The parsed entry data */
	data: TData;
	/** The file path of the content, if applicable. Relative to the site root. */
	filePath?: string;
	/** The raw body of the content, if applicable. */
	body?: string;
	/** An optional content digest, to check if the content has changed. */
	digest?: number | string;
	/** The rendered content of the entry, if applicable. */
	rendered?: RenderedContent;
	/**
	 * If an entry is a deferred, its rendering phase is delegated to a virtual module during the runtime phase when calling `renderEntry`.
	 */
	deferredRender?: boolean;
	assetImports?: Array<string>;
}

/**
 * A read-only data store for content collections. This is used to retrieve data from the content layer at runtime.
 * To add or modify data, use {@link MutableDataStore} instead.
 */

export class ImmutableDataStore {
	protected _collections = new Map<string, Map<string, any>>();

	constructor() {
		this._collections = new Map();
	}

	get<T = DataEntry>(collectionName: string, key: string): T | undefined {
		return this._collections.get(collectionName)?.get(String(key));
	}

	entries<T = DataEntry>(collectionName: string): Array<[id: string, T]> {
		const collection = this._collections.get(collectionName) ?? new Map();
		return [...collection.entries()];
	}

	values<T = DataEntry>(collectionName: string): Array<T> {
		const collection = this._collections.get(collectionName) ?? new Map();
		return [...collection.values()];
	}

	keys(collectionName: string): Array<string> {
		const collection = this._collections.get(collectionName) ?? new Map();
		return [...collection.keys()];
	}

	has(collectionName: string, key: string) {
		const collection = this._collections.get(collectionName);
		if (collection) {
			return collection.has(String(key));
		}
		return false;
	}

	hasCollection(collectionName: string) {
		return this._collections.has(collectionName);
	}

	collections() {
		return this._collections;
	}

	/**
	 * Rebuilds a collections map from a chunked-store manifest whose part file
	 * names have already been swapped for their contents.
	 *
	 * Each collection maps to a list of parts. A part is either a raw string
	 * (when the store is loaded from disk) or an ESM namespace from a `?raw`
	 * import (`{ default: string }`, when emitted into the virtual module at
	 * runtime). A collection's parts are concatenated back into the exact
	 * serialized string, then parsed with devalue. This is the inverse of
	 * {@link import('./data-store-writer.js').ChunkedWriter} and stays free of
	 * Node built-ins so it can run at runtime.
	 */
	static manifestToMap(manifest: Record<string, Array<string | { default: string }>>) {
		const collections = new Map<string, Map<string, any>>();
		for (const [collectionName, parts] of Object.entries(manifest)) {
			let stringified = '';
			for (const part of parts) {
				stringified += typeof part === 'string' ? part : part.default;
			}
			const entries: Map<string, any> = devalue.parse(stringified);
			collections.set(collectionName, entries);
		}
		return collections;
	}

	/**
	 * Attempts to load a DataStore from the virtual module.
	 * This only works in Vite.
	 */
	static async fromModule() {
		try {
			// @ts-expect-error - this is a virtual module
			const data = await import('astro:data-layer-content');
			if (data.default instanceof Map) {
				return ImmutableDataStore.fromMap(data.default);
			}
			// A single-file store is emitted as a devalue-flattened array.
			if (Array.isArray(data.default)) {
				const map = devalue.unflatten(data.default);
				return ImmutableDataStore.fromMap(map);
			}
			// A chunked store is emitted as a manifest object of collections to
			// their (lazily imported) serialized parts.
			const map = ImmutableDataStore.manifestToMap(data.default);
			return ImmutableDataStore.fromMap(map);
		} catch {}
		return new ImmutableDataStore();
	}

	static async fromMap(data: Map<string, Map<string, any>>) {
		const store = new ImmutableDataStore();
		store._collections = data;
		return store;
	}
}

function dataStoreSingleton() {
	let instance: Promise<DataStoreSource> | DataStoreSource | undefined = undefined;
	return {
		get: async (): Promise<DataStoreSource> => {
			if (!instance) {
				instance = ImmutableDataStore.fromModule().then((store) => new InMemorySource(store));
			}
			return instance;
		},
		// Note: currently unused, but kept for API stability.
		set: (store: ImmutableDataStore) => {
			instance = new InMemorySource(store);
		},
	};
}

/** @internal */
export const globalDataStore = dataStoreSingleton();
