import { existsSync, promises as fs } from 'node:fs';
import * as devalue from 'devalue';
import { Traverse } from 'neotraverse/modern';
import { imageSrcToImportId, importIdToSymbolName } from '../assets/utils/resolveImports.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { IMAGE_IMPORT_PREFIX } from './consts.js';
import { ImmutableDataStore } from './data-store.js';
import { contentModuleToId } from './utils.js';
const SAVE_DEBOUNCE_MS = 500;
const MAX_DEPTH = 10;
class MutableDataStore extends ImmutableDataStore {
	#file;
	#assetsFile;
	#modulesFile;
	#saveTimeout;
	#assetsSaveTimeout;
	#modulesSaveTimeout;
	#savePromise;
	#savePromiseResolve;
	#dirty = false;
	#assetsDirty = false;
	#modulesDirty = false;
	#assetImports = /* @__PURE__ */ new Set();
	#moduleImports = /* @__PURE__ */ new Map();
	#writeInProgress = false;
	#writeQueued = false;
	set(collectionName, key, value) {
		const collection = this._collections.get(collectionName) ?? /* @__PURE__ */ new Map();
		collection.set(String(key), value);
		this._collections.set(collectionName, collection);
		this.#saveToDiskDebounced();
	}
	delete(collectionName, key) {
		const collection = this._collections.get(collectionName);
		if (collection) {
			collection.delete(String(key));
			this.#saveToDiskDebounced();
			this.#writeAssetsImportsDebounced();
		}
	}
	clear(collectionName) {
		this._collections.delete(collectionName);
		this.#saveToDiskDebounced();
		this.#writeAssetsImportsDebounced();
	}
	clearAll() {
		this._collections.clear();
		this.#saveToDiskDebounced();
		this.#writeAssetsImportsDebounced();
	}
	addAssetImport(assetImport, filePath) {
		const id = imageSrcToImportId(assetImport, filePath);
		if (id) {
			this.#assetImports.add(id);
			this.#writeAssetsImportsDebounced();
		}
	}
	addAssetImports(assets, filePath) {
		assets.forEach((asset) => this.addAssetImport(asset, filePath));
	}
	addModuleImport(fileName) {
		const id = contentModuleToId(fileName);
		if (id) {
			this.#moduleImports.set(fileName, id);
			this.#writeModulesImportsDebounced();
		}
	}
	/**
	 * Rebuilds #assetImports from the current entries in _collections.
	 * This ensures stale import IDs are removed when entries are updated or deleted,
	 * preventing unrecoverable ImageNotFound errors in astro dev after a content entry's
	 * image path is temporarily set to an invalid value and then restored.
	 */
	#rebuildAssetImports() {
		this.#assetImports.clear();
		for (const collection of this._collections.values()) {
			for (const entry of collection.values()) {
				const typedEntry = entry;
				if (typedEntry.assetImports?.length) {
					for (const assetImport of typedEntry.assetImports) {
						const id = imageSrcToImportId(assetImport, typedEntry.filePath);
						if (id) {
							this.#assetImports.add(id);
						}
					}
				}
			}
		}
	}
	async writeAssetImports(filePath) {
		this.#assetsFile = filePath;
		this.#rebuildAssetImports();
		if (this.#assetImports.size === 0) {
			try {
				await this.#writeFileAtomic(filePath, 'export default new Map();');
			} catch (err) {
				throw new AstroError(AstroErrorData.UnknownFilesystemError, { cause: err });
			}
		}
		if (!this.#assetsDirty && existsSync(filePath)) {
			return;
		}
		const imports = [];
		const exports = [];
		const sortedAssetImports = [...this.#assetImports].sort();
		sortedAssetImports.forEach((id) => {
			const symbol = importIdToSymbolName(id);
			imports.push(`import ${symbol} from ${JSON.stringify(id)};`);
			exports.push(`[${JSON.stringify(id)}, ${symbol}]`);
		});
		const code =
			/* js */
			`
${imports.join('\n')}
export default new Map([${exports.join(', ')}]);
		`;
		try {
			await this.#writeFileAtomic(filePath, code);
		} catch (err) {
			throw new AstroError(AstroErrorData.UnknownFilesystemError, { cause: err });
		}
		this.#assetsDirty = false;
	}
	async writeModuleImports(filePath) {
		this.#modulesFile = filePath;
		if (this.#moduleImports.size === 0) {
			try {
				await this.#writeFileAtomic(filePath, 'export default new Map();');
			} catch (err) {
				throw new AstroError(AstroErrorData.UnknownFilesystemError, { cause: err });
			}
		}
		if (!this.#modulesDirty && existsSync(filePath)) {
			return;
		}
		const lines = [];
		const sortedModuleImports = [...this.#moduleImports.entries()].sort(([a], [b]) =>
			a.localeCompare(b),
		);
		for (const [fileName, specifier] of sortedModuleImports) {
			lines.push(`[${JSON.stringify(fileName)}, () => import(${JSON.stringify(specifier)})]`);
		}
		const code = `
export default new Map([
${lines.join(',\n')}]);
		`;
		try {
			await this.#writeFileAtomic(filePath, code);
		} catch (err) {
			throw new AstroError(AstroErrorData.UnknownFilesystemError, { cause: err });
		}
		this.#modulesDirty = false;
	}
	#maybeResolveSavePromise() {
		if (
			!this.#saveTimeout &&
			!this.#assetsSaveTimeout &&
			!this.#modulesSaveTimeout &&
			!this.#writeQueued &&
			!this.#writeInProgress &&
			this.#savePromiseResolve
		) {
			this.#savePromiseResolve();
			this.#savePromiseResolve = void 0;
			this.#savePromise = void 0;
		}
	}
	#writeAssetsImportsDebounced() {
		this.#assetsDirty = true;
		if (this.#assetsFile) {
			if (this.#assetsSaveTimeout) {
				clearTimeout(this.#assetsSaveTimeout);
			}
			if (!this.#savePromise) {
				this.#savePromise = new Promise((resolve) => {
					this.#savePromiseResolve = resolve;
				});
			}
			this.#assetsSaveTimeout = setTimeout(async () => {
				this.#assetsSaveTimeout = void 0;
				await this.writeAssetImports(this.#assetsFile);
				this.#maybeResolveSavePromise();
			}, SAVE_DEBOUNCE_MS);
		}
	}
	#writeModulesImportsDebounced() {
		this.#modulesDirty = true;
		if (this.#modulesFile) {
			if (this.#modulesSaveTimeout) {
				clearTimeout(this.#modulesSaveTimeout);
			}
			if (!this.#savePromise) {
				this.#savePromise = new Promise((resolve) => {
					this.#savePromiseResolve = resolve;
				});
			}
			this.#modulesSaveTimeout = setTimeout(async () => {
				this.#modulesSaveTimeout = void 0;
				await this.writeModuleImports(this.#modulesFile);
				this.#maybeResolveSavePromise();
			}, SAVE_DEBOUNCE_MS);
		}
	}
	// Skips the debounce and writes to disk immediately
	async #saveToDiskNow() {
		if (this.#saveTimeout) {
			clearTimeout(this.#saveTimeout);
		}
		this.#saveTimeout = void 0;
		if (this.#file) {
			await this.writeToDisk();
		}
		this.#maybeResolveSavePromise();
	}
	#saveToDiskDebounced() {
		this.#dirty = true;
		if (this.#saveTimeout) {
			clearTimeout(this.#saveTimeout);
		}
		if (!this.#savePromise) {
			this.#savePromise = new Promise((resolve) => {
				this.#savePromiseResolve = resolve;
			});
		}
		this.#saveTimeout = setTimeout(async () => {
			this.#saveTimeout = void 0;
			if (this.#file) {
				await this.writeToDisk();
			}
			this.#maybeResolveSavePromise();
		}, SAVE_DEBOUNCE_MS);
	}
	#writing = /* @__PURE__ */ new Set();
	#pending = /* @__PURE__ */ new Set();
	async #writeFileAtomic(filePath, data, depth = 0) {
		if (depth > MAX_DEPTH) {
			return;
		}
		const fileKey = filePath.toString();
		if (this.#writing.has(fileKey)) {
			this.#pending.add(fileKey);
			return;
		}
		this.#writing.add(fileKey);
		const tempFile = filePath instanceof URL ? new URL(`${filePath.href}.tmp`) : `${filePath}.tmp`;
		try {
			const oldData = await fs.readFile(filePath, 'utf-8').catch(() => '');
			if (oldData === data) {
				return;
			}
			await fs.writeFile(tempFile, data);
			await fs.rename(tempFile, filePath);
		} finally {
			this.#writing.delete(fileKey);
			if (this.#pending.has(fileKey)) {
				this.#pending.delete(fileKey);
				await this.#writeFileAtomic(filePath, data, depth + 1);
			}
		}
	}
	scopedStore(collectionName) {
		return {
			get: (key) => this.get(collectionName, key),
			entries: () => this.entries(collectionName),
			values: () => this.values(collectionName),
			keys: () => this.keys(collectionName),
			set: ({ id: key, data, body, filePath, deferredRender, digest, rendered, assetImports }) => {
				if (!key) {
					throw new Error(`ID must be a non-empty string`);
				}
				const id = String(key);
				if (digest) {
					const existing = this.get(collectionName, id);
					if (existing && existing.digest === digest) {
						return false;
					}
				}
				const foundAssets = new Set(assetImports);
				new Traverse(data).forEach((_, val) => {
					if (typeof val === 'string' && val.startsWith(IMAGE_IMPORT_PREFIX)) {
						const src = val.replace(IMAGE_IMPORT_PREFIX, '');
						foundAssets.add(src);
					}
				});
				const entry = {
					id,
					data,
				};
				if (body) {
					entry.body = body;
				}
				if (filePath) {
					if (filePath.startsWith('/')) {
						throw new Error(`File path must be relative to the site root. Got: ${filePath}`);
					}
					entry.filePath = filePath;
				}
				if (foundAssets.size) {
					entry.assetImports = Array.from(foundAssets);
					this.addAssetImports(entry.assetImports, filePath);
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
			delete: (key) => this.delete(collectionName, key),
			clear: () => this.clear(collectionName),
			has: (key) => this.has(collectionName, key),
			addAssetImport: (assetImport, fileName) => this.addAssetImport(assetImport, fileName),
			addAssetImports: (assets, fileName) => this.addAssetImports(assets, fileName),
			addModuleImport: (fileName) => this.addModuleImport(fileName),
		};
	}
	/**
	 * Returns a MetaStore for a given collection, or if no collection is provided, the default meta collection.
	 */
	metaStore(collectionName = ':meta') {
		const collectionKey = `meta:${collectionName}`;
		return {
			get: (key) => this.get(collectionKey, key),
			set: (key, data) => this.set(collectionKey, key, data),
			delete: (key) => this.delete(collectionKey, key),
			has: (key) => this.has(collectionKey, key),
		};
	}
	/**
	 * Returns a promise that resolves when all pending saves are complete.
	 * This includes any in-progress debounced saves for the data store, asset imports, and module imports.
	 */
	async waitUntilSaveComplete() {
		if (!this.#savePromise) {
			return Promise.resolve();
		}
		await this.#saveToDiskNow();
		return this.#savePromise;
	}
	toString() {
		const sorted = new Map(
			[...this._collections.entries()]
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([key, collection]) => [
					key,
					new Map([...collection.entries()].sort(([a], [b]) => a.localeCompare(b))),
				]),
		);
		return devalue.stringify(sorted);
	}
	async writeToDisk() {
		if (!this.#dirty) {
			return;
		}
		if (!this.#file) {
			throw new AstroError(AstroErrorData.UnknownFilesystemError);
		}
		if (this.#writeInProgress) {
			this.#writeQueued = true;
			return;
		}
		try {
			this.#dirty = false;
			this.#writeInProgress = true;
			await this.#writeFileAtomic(this.#file, this.toString());
		} catch (err) {
			throw new AstroError(AstroErrorData.UnknownFilesystemError, { cause: err });
		} finally {
			this.#writeInProgress = false;
			if (this.#writeQueued) {
				this.#writeQueued = false;
				await this.writeToDisk();
			}
		}
	}
	/**
	 * Attempts to load a MutableDataStore from the virtual module.
	 * This only works in Vite.
	 */
	static async fromModule() {
		try {
			const data = await import('astro:data-layer-content');
			const map = devalue.unflatten(data.default);
			return MutableDataStore.fromMap(map);
		} catch {}
		return new MutableDataStore();
	}
	static async fromMap(data) {
		const store = new MutableDataStore();
		store._collections = data;
		return store;
	}
	static async fromString(data) {
		const map = devalue.parse(data);
		return MutableDataStore.fromMap(map);
	}
	static async fromFile(filePath) {
		try {
			if (existsSync(filePath)) {
				const data = await fs.readFile(filePath, 'utf-8');
				const store2 = await MutableDataStore.fromString(data);
				store2.#file = filePath;
				return store2;
			} else {
				await fs.mkdir(new URL('./', filePath), { recursive: true });
			}
		} catch {}
		const store = new MutableDataStore();
		store.#file = filePath;
		return store;
	}
}
export { MutableDataStore };
