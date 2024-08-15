import { promises as fs, type PathLike, existsSync } from 'fs';
import type { MarkdownHeading } from '@astrojs/markdown-remark';
import * as devalue from 'devalue';
import { imageSrcToImportId, importIdToSymbolName } from '../assets/utils/resolveImports.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { CONTENT_MODULE_FLAG, DEFERRED_MODULE } from './consts.js';

const SAVE_DEBOUNCE_MS = 500;

export interface RenderedContent {
	/** Rendered HTML string. If present then `render(entry)` will return a component that renders this HTML. */
	html: string;
	metadata?: {
		/** Any images that are present in this entry. Relative to the {@link DataEntry} filePath. */
		imagePaths?: Array<string>;
		/** Any headings that are present in this file. */
		headings?: MarkdownHeading[];
		/** Raw frontmatter, parsed parsed from the file. This may include data from remark plugins. */
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
}

export class DataStore {
	#collections = new Map<string, Map<string, any>>();

	#file?: PathLike;

	#assetsFile?: PathLike;
	#modulesFile?: PathLike;

	#saveTimeout: NodeJS.Timeout | undefined;
	#assetsSaveTimeout: NodeJS.Timeout | undefined;
	#modulesSaveTimeout: NodeJS.Timeout | undefined;

	#dirty = false;
	#assetsDirty = false;
	#modulesDirty = false;

	#assetImports = new Set<string>();
	#moduleImports = new Map<string, string>();

	constructor() {
		this.#collections = new Map();
	}

	get<T = DataEntry>(collectionName: string, key: string): T | undefined {
		return this.#collections.get(collectionName)?.get(String(key));
	}

	entries<T = DataEntry>(collectionName: string): Array<[id: string, T]> {
		const collection = this.#collections.get(collectionName) ?? new Map();
		return [...collection.entries()];
	}

	values<T = DataEntry>(collectionName: string): Array<T> {
		const collection = this.#collections.get(collectionName) ?? new Map();
		return [...collection.values()];
	}

	keys(collectionName: string): Array<string> {
		const collection = this.#collections.get(collectionName) ?? new Map();
		return [...collection.keys()];
	}

	set(collectionName: string, key: string, value: unknown) {
		const collection = this.#collections.get(collectionName) ?? new Map();
		collection.set(String(key), value);
		this.#collections.set(collectionName, collection);
		this.#saveToDiskDebounced();
	}

	delete(collectionName: string, key: string) {
		const collection = this.#collections.get(collectionName);
		if (collection) {
			collection.delete(String(key));
			this.#saveToDiskDebounced();
		}
	}

	clear(collectionName: string) {
		this.#collections.delete(collectionName);
		this.#saveToDiskDebounced();
	}

	clearAll() {
		this.#collections.clear();
		this.#saveToDiskDebounced();
	}

	has(collectionName: string, key: string) {
		const collection = this.#collections.get(collectionName);
		if (collection) {
			return collection.has(String(key));
		}
		return false;
	}

	hasCollection(collectionName: string) {
		return this.#collections.has(collectionName);
	}

	collections() {
		return this.#collections;
	}

	addAssetImport(assetImport: string, filePath: string) {
		const id = imageSrcToImportId(assetImport, filePath);
		if (id) {
			this.#assetImports.add(id);
			// We debounce the writes to disk because addAssetImport is called for every image in every file,
			// and can be called many times in quick succession by a filesystem watcher. We only want to write
			// the file once, after all the imports have been added.
			this.#writeAssetsImportsDebounced();
		}
	}

	addAssetImports(assets: Array<string>, filePath: string) {
		assets.forEach((asset) => this.addAssetImport(asset, filePath));
	}

	addModuleImport(fileName: string) {
		const id = contentModuleToId(fileName);
		if (id) {
			this.#moduleImports.set(fileName, id);
			// We debounce the writes to disk because addAssetImport is called for every image in every file,
			// and can be called many times in quick succession by a filesystem watcher. We only want to write
			// the file once, after all the imports have been added.
			this.#writeModulesImportsDebounced();
		}
	}

	async writeAssetImports(filePath: PathLike) {
		this.#assetsFile = filePath;

		if (this.#assetImports.size === 0) {
			try {
				await fs.writeFile(filePath, 'export default new Map();');
			} catch (err) {
				throw new AstroError(AstroErrorData.UnknownFilesystemError, { cause: err });
			}
		}

		if (!this.#assetsDirty && existsSync(filePath)) {
			return;
		}
		// Import the assets, with a symbol name that is unique to the import id. The import
		// for each asset is an object with path, format and dimensions.
		// We then export them all, mapped by the import id, so we can find them again in the build.
		const imports: Array<string> = [];
		const exports: Array<string> = [];
		this.#assetImports.forEach((id) => {
			const symbol = importIdToSymbolName(id);
			imports.push(`import ${symbol} from '${id}';`);
			exports.push(`[${JSON.stringify(id)}, ${symbol}]`);
		});
		const code = /* js */ `
${imports.join('\n')}
export default new Map([${exports.join(', ')}]);
		`;
		try {
			await fs.writeFile(filePath, code);
		} catch (err) {
			throw new AstroError(AstroErrorData.UnknownFilesystemError, { cause: err });
		}
		this.#assetsDirty = false;
	}

	async writeModuleImports(filePath: PathLike) {
		this.#modulesFile = filePath;

		if (this.#moduleImports.size === 0) {
			try {
				await fs.writeFile(filePath, 'export default new Map();');
			} catch (err) {
				throw new AstroError(AstroErrorData.UnknownFilesystemError, { cause: err });
			}
		}

		if (!this.#modulesDirty && existsSync(filePath)) {
			return;
		}

		// Import the assets, with a symbol name that is unique to the import id. The import
		// for each asset is an object with path, format and dimensions.
		// We then export them all, mapped by the import id, so we can find them again in the build.
		const lines: Array<string> = [];
		for (const [fileName, specifier] of this.#moduleImports) {
			lines.push(`['${fileName}', () => import('${specifier}')]`);
		}
		const code = `
export default new Map([\n${lines.join(',\n')}]);
		`;
		try {
			await fs.writeFile(filePath, code);
		} catch (err) {
			throw new AstroError(AstroErrorData.UnknownFilesystemError, { cause: err });
		}
		this.#modulesDirty = false;
	}

	#writeAssetsImportsDebounced() {
		this.#assetsDirty = true;
		if (this.#assetsFile) {
			if (this.#assetsSaveTimeout) {
				clearTimeout(this.#assetsSaveTimeout);
			}
			this.#assetsSaveTimeout = setTimeout(() => {
				this.#assetsSaveTimeout = undefined;
				this.writeAssetImports(this.#assetsFile!);
			}, SAVE_DEBOUNCE_MS);
		}
	}

	#writeModulesImportsDebounced() {
		this.#modulesDirty = true;
		if (this.#modulesFile) {
			if (this.#modulesSaveTimeout) {
				clearTimeout(this.#modulesSaveTimeout);
			}
			this.#modulesSaveTimeout = setTimeout(() => {
				this.#modulesSaveTimeout = undefined;
				this.writeModuleImports(this.#modulesFile!);
			}, SAVE_DEBOUNCE_MS);
		}
	}

	#saveToDiskDebounced() {
		this.#dirty = true;
		// Only save to disk if it has already been saved once
		if (this.#file) {
			if (this.#saveTimeout) {
				clearTimeout(this.#saveTimeout);
			}
			this.#saveTimeout = setTimeout(() => {
				this.#saveTimeout = undefined;
				this.writeToDisk(this.#file!);
			}, SAVE_DEBOUNCE_MS);
		}
	}

	scopedStore(collectionName: string): ScopedDataStore {
		return {
			get: <TData extends Record<string, unknown> = Record<string, unknown>>(key: string) =>
				this.get<DataEntry<TData>>(collectionName, key),
			entries: () => this.entries(collectionName),
			values: () => this.values(collectionName),
			keys: () => this.keys(collectionName),
			set: ({ id: key, data, body, filePath, deferredRender, digest, rendered }) => {
				if (!key) {
					throw new Error(`ID must be a non-empty string`);
				}
				const id = String(key);
				if (digest) {
					const existing = this.get<DataEntry>(collectionName, id);
					if (existing && existing.digest === digest) {
						return false;
					}
				}
				const entry: DataEntry = {
					id,
					data,
				};
				// We do it like this so we don't waste space stringifying
				// the fields if they are not set
				if (body) {
					entry.body = body;
				}
				if (filePath) {
					if (filePath.startsWith('/')) {
						throw new Error(`File path must be relative to the site root. Got: ${filePath}`);
					}
					entry.filePath = filePath;
				}
				if (digest) {
					entry.digest = digest;
				}
				if (rendered) {
					entry.rendered = rendered;
				}
				if (deferredRender) {
					entry.deferredRender = deferredRender;
					if (filePath) {
						this.addModuleImport(filePath);
					}
				}
				this.set(collectionName, id, entry);
				return true;
			},
			delete: (key: string) => this.delete(collectionName, key),
			clear: () => this.clear(collectionName),
			has: (key: string) => this.has(collectionName, key),
			addAssetImport: (assetImport: string, fileName: string) =>
				this.addAssetImport(assetImport, fileName),
			addAssetImports: (assets: Array<string>, fileName: string) =>
				this.addAssetImports(assets, fileName),
			addModuleImport: (fileName: string) => this.addModuleImport(fileName),
		};
	}
	/**
	 * Returns a MetaStore for a given collection, or if no collection is provided, the default meta collection.
	 */
	metaStore(collectionName = ':meta'): MetaStore {
		const collectionKey = `meta:${collectionName}`;
		return {
			get: (key: string) => this.get(collectionKey, key),
			set: (key: string, data: string) => this.set(collectionKey, key, data),
			delete: (key: string) => this.delete(collectionKey, key),
			has: (key: string) => this.has(collectionKey, key),
		};
	}

	toString() {
		return devalue.stringify(this.#collections);
	}

	async writeToDisk(filePath: PathLike) {
		if (!this.#dirty) {
			return;
		}
		try {
			await fs.writeFile(filePath, this.toString());
			this.#file = filePath;
			this.#dirty = false;
		} catch (err) {
			throw new AstroError(AstroErrorData.UnknownFilesystemError, { cause: err });
		}
	}

	/**
	 * Attempts to load a DataStore from the virtual module.
	 * This only works in Vite.
	 */
	static async fromModule() {
		try {
			// @ts-expect-error - this is a virtual module
			const data = await import('astro:data-layer-content');
			const map = devalue.unflatten(data.default);
			return DataStore.fromMap(map);
		} catch {}
		return new DataStore();
	}

	static async fromMap(data: Map<string, Map<string, any>>) {
		const store = new DataStore();
		store.#collections = data;
		return store;
	}

	static async fromString(data: string) {
		const map = devalue.parse(data);
		return DataStore.fromMap(map);
	}

	static async fromFile(filePath: string | URL) {
		try {
			if (existsSync(filePath)) {
				const data = await fs.readFile(filePath, 'utf-8');
				return DataStore.fromString(data);
			}
		} catch {}
		return new DataStore();
	}
}

export interface ScopedDataStore {
	get: <TData extends Record<string, unknown> = Record<string, unknown>>(
		key: string,
	) => DataEntry<TData> | undefined;
	entries: () => Array<[id: string, DataEntry]>;
	set: <TData extends Record<string, unknown>>(opts: {
		/** The ID of the entry. Must be unique per collection. */
		id: string;
		/** The data to store. */
		data: TData;
		/** The raw body of the content, if applicable. */
		body?: string;
		/** The file path of the content, if applicable. Relative to the site root. */
		filePath?: string;
		/** A content digest, to check if the content has changed. */
		digest?: number | string;
		/** The rendered content, if applicable. */
		rendered?: RenderedContent;
		/**
		 * If an entry is a deferred, its rendering phase is delegated to a virtual module during the runtime phase.
		 */
		deferredRender?: boolean;
	}) => boolean;
	values: () => Array<DataEntry>;
	keys: () => Array<string>;
	delete: (key: string) => void;
	clear: () => void;
	has: (key: string) => boolean;
	/**
	 * @internal Adds asset imports to the store. This is used to track image imports for the build. This API is subject to change.
	 */
	addAssetImports: (assets: Array<string>, fileName: string) => void;
	/**
	 * @internal Adds an asset import to the store. This is used to track image imports for the build. This API is subject to change.
	 */
	addAssetImport: (assetImport: string, fileName: string) => void;
	/**
	 * Adds a single asset to the store. This asset will be transformed
	 * by Vite, and the URL will be available in the final build.
	 * @param fileName
	 * @param specifier
	 * @returns
	 */
	addModuleImport: (fileName: string) => void;
}

/**
 * A key-value store for metadata strings. Useful for storing things like sync tokens.
 */

export interface MetaStore {
	get: (key: string) => string | undefined;
	set: (key: string, value: string) => void;
	has: (key: string) => boolean;
	delete: (key: string) => void;
}

function dataStoreSingleton() {
	let instance: Promise<DataStore> | DataStore | undefined = undefined;
	return {
		get: async () => {
			if (!instance) {
				instance = DataStore.fromModule();
			}
			return instance;
		},
		set: (store: DataStore) => {
			instance = store;
		},
	};
}

// TODO: find a better place to put this image
export function contentModuleToId(fileName: string) {
	const params = new URLSearchParams(DEFERRED_MODULE);
	params.set('fileName', fileName);
	params.set(CONTENT_MODULE_FLAG, 'true');
	return `${DEFERRED_MODULE}?${params.toString()}`;
}

/** @internal */
export const globalDataStore = dataStoreSingleton();
