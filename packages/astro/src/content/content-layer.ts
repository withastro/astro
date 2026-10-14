import { existsSync, promises as fs } from 'node:fs';
import { parseFrontmatter } from '@astrojs/internal-helpers/frontmatter';
import type { MarkdownRenderer } from '@astrojs/internal-helpers/markdown';
import PQueue from 'p-queue';
import type { FSWatcher } from 'vite';
import xxhash from 'xxhash-wasm';
import type * as z from 'zod/v4';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import type { AstroLogger } from '../core/logger/core.js';
import type { AstroSettings } from '../types/astro.js';
import type { ContentEntryType, RefreshContentOptions } from '../types/public/content.js';
import {
	ASSET_IMPORTS_FILE,
	COLLECTIONS_MANIFEST_FILE,
	CONTENT_LAYER_TYPE,
	MODULES_IMPORTS_FILE,
} from './consts.js';
import type { RenderedContent } from './data-store.js';
import type { ExternalDataStore } from './external-data-store.js';
import type {
	ExternalLoaderContext,
	LoaderContext,
	RenderMarkdownOptions,
} from './loaders/types.js';
import type { MutableDataStore } from './mutable-data-store.js';
import {
	type ContentConfig,
	type ContentObservable,
	getEntryConfigByExtMap,
	getEntryData,
	globalContentConfigObserver,
	loaderReturnSchema,
	safeStringify,
} from './utils.js';
import { createWatcherWrapper, type WrappedWatcher } from './watcher.js';

export interface ContentLayerOptions {
	store: MutableDataStore;
	/**
	 * The store of the collections defined with `storage: 'external'`.
	 * It's closed when the content layer is disposed.
	 */
	externalStore?: ExternalDataStore;
	settings: AstroSettings;
	logger: AstroLogger;
	watcher?: FSWatcher;
	contentConfigObserver?: ContentObservable;
	/** Clears the collections defined with `storage: 'external'` in the first sync. */
	force?: boolean;
}

type CollectionLoader<TData> = () =>
	| Array<TData>
	| Promise<Array<TData>>
	| Record<string, Record<string, unknown>>
	| Promise<Record<string, Record<string, unknown>>>;

/** The collection under which Astro saves its own meta values in the external store */
const EXTERNAL_STORE_META_COLLECTION = ':meta';

const EXTERNAL_WRITES_DEBOUNCE_MS = 500;

export class ContentLayer {
	#logger: AstroLogger;
	#store: MutableDataStore;
	#externalStore?: ExternalDataStore;
	#externalCollectionNames: Array<string> = [];
	#externalWritesPending = false;
	#externalWritesTimeout: NodeJS.Timeout | undefined;
	#unsubscribeExternalWrites?: () => void;
	#force: boolean;
	#settings: AstroSettings;
	#watcher?: WrappedWatcher;
	#lastConfigDigest?: string;
	#unsubscribe?: () => void;
	#markdownRenderer?: MarkdownRenderer;
	#generateDigest?: (data: Record<string, unknown> | string) => string;
	#contentConfigObserver: ContentObservable;

	#queue: PQueue;

	constructor({
		settings,
		logger,
		store,
		externalStore,
		watcher,
		contentConfigObserver = globalContentConfigObserver,
		force = false,
	}: ContentLayerOptions) {
		this.#logger = logger;
		this.#store = store;
		this.#externalStore = externalStore;
		this.#force = force;
		this.#settings = settings;
		this.#contentConfigObserver = contentConfigObserver;
		if (watcher) {
			this.#watcher = createWatcherWrapper(watcher);
		}
		this.#queue = new PQueue({ concurrency: 1 });
		this.#unsubscribeExternalWrites = externalStore?.onWrite(() =>
			this.#saveExternalWritesDebounced(),
		);
	}

	/**
	 * Whether the content layer is currently loading content
	 */
	get loading() {
		return this.#queue.size > 0 || this.#queue.pending > 0;
	}

	get store() {
		return this.#store;
	}

	/**
	 * Watch for changes to the content config and trigger a sync when it changes.
	 */
	watchContentConfig() {
		this.#unsubscribe?.();
		this.#unsubscribe = this.#contentConfigObserver.subscribe(async (ctx) => {
			if (ctx.status === 'loaded' && ctx.config.digest !== this.#lastConfigDigest) {
				this.sync();
			}
		});
	}

	unwatchContentConfig() {
		this.#unsubscribe?.();
	}

	dispose() {
		this.#queue.clear();
		this.#unsubscribe?.();
		this.#watcher?.removeAllTrackedListeners();
		clearTimeout(this.#externalWritesTimeout);
		this.#unsubscribeExternalWrites?.();
		const externalStore = this.#externalStore;
		if (externalStore) {
			// A running sync may still be using the store
			this.#queue
				.onIdle()
				.then(() => externalStore.close())
				.catch((error) => {
					this.#logger.error('content', `Failed to close the external content storage.\n${error}`);
				});
		}
	}

	// Loaders can save entries in the external store outside of a sync, for example when the
	// watcher reports a change. Once they stop saving for a moment, the changes are committed
	// like at the end of a sync.
	#saveExternalWritesDebounced() {
		this.#externalWritesPending = true;
		clearTimeout(this.#externalWritesTimeout);
		this.#externalWritesTimeout = setTimeout(() => {
			this.#externalWritesTimeout = undefined;
			this.#queue
				.add(async () => {
					// A sync that ran after the writes has already committed them
					if (this.#externalWritesPending) {
						await this.#saveStores();
					}
				})
				.catch((error) => {
					this.#logger.error('content', `Failed to save content changes.\n${error}`);
				});
		}, EXTERNAL_WRITES_DEBOUNCE_MS);
	}

	async #getGenerateDigest() {
		if (this.#generateDigest) {
			return this.#generateDigest;
		}
		// xxhash is a very fast non-cryptographic hash function that is used to generate a content digest
		// It uses wasm, so we need to load it asynchronously.
		const { h64ToString } = await xxhash();

		this.#generateDigest = (data: unknown) => {
			const dataString = typeof data === 'string' ? data : JSON.stringify(data);
			return h64ToString(dataString);
		};

		return this.#generateDigest;
	}

	async #getLoaderContext({
		collectionName,
		loaderName = 'content',
		parseData,
		refreshContextData,
	}: {
		collectionName: string;
		loaderName: string;
		parseData: LoaderContext['parseData'];
		refreshContextData?: Record<string, unknown>;
	}): Promise<LoaderContext> {
		return {
			collection: collectionName,
			store: this.#store.scopedStore(collectionName),
			meta: this.#store.metaStore(collectionName),
			logger: this.#logger.forkIntegrationLogger(loaderName),
			config: this.#settings.config,
			parseData,
			renderMarkdown: this.#processMarkdown.bind(this),
			generateDigest: await this.#getGenerateDigest(),
			watcher: this.#watcher,
			refreshContextData,
			entryTypes: getEntryConfigByExtMap([
				...this.#settings.contentEntryTypes,
				...this.#settings.dataEntryTypes,
			] as Array<ContentEntryType>),
		};
	}

	async #processMarkdown(
		content: string,
		options?: RenderMarkdownOptions,
	): Promise<RenderedContent> {
		if (!this.#markdownRenderer) {
			const { markdown, image } = this.#settings.config;
			this.#markdownRenderer = await markdown.processor.createRenderer({
				image,
				syntaxHighlight: markdown.syntaxHighlight,
				shikiConfig: markdown.shikiConfig,
				gfm: markdown.gfm,
				smartypants: markdown.smartypants,
			});
		}
		const { frontmatter, content: body } = parseFrontmatter(content);
		const { code, metadata } = await this.#markdownRenderer.render(body, {
			frontmatter,
			fileURL: options?.fileURL,
		});
		return {
			html: code,
			metadata: {
				...metadata,
				imagePaths: (metadata.localImagePaths ?? []).concat(metadata.remoteImagePaths ?? []),
			},
		};
	}

	/**
	 * Enqueues a sync job that runs the `load()` method of each collection's loader, which will load the data and save it in the data store.
	 * The loader itself is responsible for deciding whether this will clear and reload the full collection, or
	 * perform an incremental update. After the data is loaded, the data store is written to disk. Jobs are queued,
	 * so that only one sync can run at a time. The function returns a promise that resolves when this sync job is complete.
	 */

	sync(options: RefreshContentOptions = {}): Promise<void> {
		return this.#queue.add(() => this.#doSync(options));
	}

	async #doSync(options: RefreshContentOptions) {
		let contentConfig = this.#contentConfigObserver.get();
		const logger = this.#logger.forkIntegrationLogger('content');

		if (contentConfig?.status === 'loading') {
			contentConfig = await Promise.race<ReturnType<ContentObservable['get']>>([
				new Promise((resolve) => {
					const unsub = this.#contentConfigObserver.subscribe((ctx) => {
						unsub();
						resolve(ctx);
					});
				}),
				new Promise((resolve) =>
					setTimeout(
						() =>
							resolve({ status: 'error', error: new Error('Content config loading timed out') }),
						5000,
					),
				),
			]);
		}

		switch (contentConfig?.status) {
			case 'loaded':
				// Proceed with sync
				break;
			case 'error':
				// Log error and skip sync
				logger.error(
					`Error loading content config. Skipping sync.\n${contentConfig.error.message}`,
				);
				return;
			case 'does-not-exist':
				// No content config file exists, skip sync silently
				return;
			case 'init':
			case 'loading':
			case undefined:
				// Should have loaded by now, but didn't
				logger.error(
					`Content config not loaded, skipping sync. Status was ${contentConfig?.status}`,
				);
				return;
		}

		const externalCollectionNames = this.#getExternalCollectionNames(
			contentConfig.config.collections,
		);
		this.#externalCollectionNames = externalCollectionNames;

		logger.info('Syncing content');
		const {
			vite: _vite,
			integrations: _integrations,
			adapter: _adapter,
			...hashableConfig
		} = this.#settings.config;

		const astroConfigDigest = safeStringify(hashableConfig);

		const { digest: currentConfigDigest } = contentConfig.config;
		this.#lastConfigDigest = currentConfigDigest;

		let shouldClear = false;
		const previousConfigDigest = this.#store.metaStore().get('content-config-digest');
		const previousAstroConfigDigest = this.#store.metaStore().get('astro-config-digest');
		const previousAstroVersion = this.#store.metaStore().get('astro-version');

		if (previousAstroConfigDigest && previousAstroConfigDigest !== astroConfigDigest) {
			logger.info('Astro config changed');
			shouldClear = true;
		}

		if (previousConfigDigest && previousConfigDigest !== currentConfigDigest) {
			logger.info('Content config changed');
			shouldClear = true;
		}
		if (previousAstroVersion && previousAstroVersion !== process.env.ASTRO_VERSION) {
			logger.info('Astro version changed');
			shouldClear = true;
		}
		if (shouldClear) {
			logger.info('Clearing content store');
			this.#store.clearAll();
		}
		if (process.env.ASTRO_VERSION) {
			this.#store.metaStore().set('astro-version', process.env.ASTRO_VERSION);
		}
		if (currentConfigDigest) {
			this.#store.metaStore().set('content-config-digest', currentConfigDigest);
		}
		if (astroConfigDigest) {
			this.#store.metaStore().set('astro-config-digest', astroConfigDigest);
		}

		if (this.#externalStore && externalCollectionNames.length > 0) {
			// The external store can outlive the data store on disk, for example when a build
			// starts without a cache, so it's checked against its own digest.
			const generateDigest = await this.#getGenerateDigest();
			const digest = generateDigest({
				astroVersion: process.env.ASTRO_VERSION,
				contentConfigDigest: currentConfigDigest,
				astroConfigDigest,
			});
			const externalMeta = this.#externalStore.metaStore(EXTERNAL_STORE_META_COLLECTION);
			const previousDigest = await externalMeta.get('digest');
			if (this.#force || (previousDigest && previousDigest !== digest)) {
				logger.info('Clearing external content storage');
				await this.#externalStore.clearCollections(externalCollectionNames);
			}
			this.#force = false;
			if (previousDigest !== digest) {
				await externalMeta.set('digest', digest);
			}
		}

		if (!options?.loaders?.length) {
			// Remove all listeners before syncing, as they will be re-added by the loaders, but not if this is a selective sync
			this.#watcher?.removeAllTrackedListeners();
		}

		const backwardsCompatEnabled =
			this.#settings.config.legacy?.collectionsBackwardsCompat ?? false;

		await Promise.all(
			Object.entries(contentConfig.config.collections).map(async ([name, collection]) => {
				// Skip non-content_layer collections unless backwards compat is enabled
				if (collection.type !== CONTENT_LAYER_TYPE && !backwardsCompatEnabled) {
					return;
				}
				// If backwards compat is disabled, skip old-style collections
				if (collection.type !== CONTENT_LAYER_TYPE && !('loader' in collection)) {
					return;
				}

				let { schema } = collection;
				const loaderName = 'loader' in collection ? (collection as any).loader.name : 'content';

				if (!schema && 'loader' in collection && typeof collection.loader === 'object') {
					schema = collection.loader.schema;
					if (!schema && collection.loader.createSchema) {
						({ schema } = await collection.loader.createSchema());
					}
				}

				// If loaders are specified, only sync the specified loaders
				if (
					options?.loaders &&
					'loader' in collection &&
					(typeof collection.loader !== 'object' ||
						!options.loaders.includes((collection as any).loader.name))
				) {
					return;
				}

				const context = await this.#getLoaderContext({
					collectionName: name,
					parseData: ({ id, data, filePath = '' }) =>
						getEntryData(
							{
								id,
								collection: name,
								unvalidatedData: data,
								_internal: {
									rawData: undefined,
									filePath,
								},
							},
							{ ...collection, schema },
							false,
						),
					loaderName,
					refreshContextData: options?.context,
				});

				if ('loader' in collection) {
					const externalStore = externalCollectionNames.includes(name)
						? this.#externalStore
						: undefined;
					const externalContext: ExternalLoaderContext | undefined = externalStore && {
						...context,
						storage: 'external',
						store: externalStore.scopedStore(name),
						meta: externalStore.metaStore(name),
					};

					if (typeof collection.loader === 'function') {
						const handler = collection.loader as CollectionLoader<{ id: string }>;
						return externalContext
							? externalSimpleLoader(handler, externalContext)
							: simpleLoader(handler, context);
					}

					if (!collection.loader?.load) {
						throw new Error(`Collection loader for ${name} does not have a load method`);
					}

					// `#getExternalCollectionNames()` checked that the loader accepts this context
					return collection.loader.load(
						externalContext ? (externalContext as unknown as LoaderContext) : context,
					);
				}
			}),
		);
		await this.#validateReferences(contentConfig.config.collections, logger);
		await this.#saveStores();
		logger.info('Synced content');
		if (this.#settings.config.experimental.contentIntellisense) {
			await this.regenerateCollectionFileManifest();
		}
	}

	/**
	 * Returns the names of the collections defined with `storage: 'external'`.
	 *
	 * @throws {AstroError} `ContentStorageDriverMissing` when there's no external store, or
	 * `ContentLoaderExternalStorageUnsupported` when the loader of one of these collections
	 * doesn't set `supportsExternalStorage`.
	 */
	#getExternalCollectionNames(collections: ContentConfig['collections']): Array<string> {
		const names: Array<string> = [];
		for (const [name, collection] of Object.entries(collections)) {
			if (collection.type !== CONTENT_LAYER_TYPE || collection.storage !== 'external') {
				continue;
			}
			if (!this.#externalStore) {
				throw new AstroError({
					...AstroErrorData.ContentStorageDriverMissing,
					message: AstroErrorData.ContentStorageDriverMissing.message(name),
				});
			}
			if (typeof collection.loader === 'object' && !collection.loader.supportsExternalStorage) {
				throw new AstroError({
					...AstroErrorData.ContentLoaderExternalStorageUnsupported,
					message: AstroErrorData.ContentLoaderExternalStorageUnsupported.message(
						name,
						collection.loader.name,
					),
				});
			}
			names.push(name);
		}
		return names;
	}

	/**
	 * Writes the import files for the entries of both stores, then waits until both stores
	 * have saved their changes.
	 */
	async #saveStores() {
		if (this.#externalStore) {
			this.#externalWritesPending = false;
			const { assetImports, moduleImports } = await this.#externalStore.collectImports(
				this.#externalCollectionNames,
			);
			this.#store.setExternalImports(assetImports, moduleImports);
		}
		await fs.mkdir(this.#settings.config.cacheDir, { recursive: true });
		await fs.mkdir(this.#settings.dotAstroDir, { recursive: true });
		const assetImportsFile = new URL(ASSET_IMPORTS_FILE, this.#settings.dotAstroDir);
		await this.#store.writeAssetImports(assetImportsFile);
		const modulesImportsFile = new URL(MODULES_IMPORTS_FILE, this.#settings.dotAstroDir);
		await this.#store.writeModuleImports(modulesImportsFile);
		await this.#store.waitUntilSaveComplete();
		// The dev server reloads content when the external store is flushed, so the import
		// files must be written first.
		await this.#externalStore?.flush();
	}

	/**
	 * After all loaders complete, walks every entry's data to find reference objects
	 * (`{ id, collection }`) and checks that the referenced entry exists in the store.
	 * This replaces the inline Zod validation that was removed in the Zod 4 upgrade.
	 */
	async #validateReferences(
		collections: Record<string, any>,
		logger: { error(message: string): void },
	) {
		const collectionNames = new Set(Object.keys(collections));
		// The IDs of external collections are read once, instead of asking the driver for each reference
		const externalIds = new Map<string, Set<string>>();
		for (const collectionName of this.#externalCollectionNames) {
			const ids = await this.#externalStore?.scopedStore(collectionName).keys();
			externalIds.set(collectionName, new Set(ids));
		}
		const hasEntry = (collectionName: string, id: string) =>
			externalIds.get(collectionName)?.has(id) ?? this.#store.has(collectionName, id);
		for (const collectionName of collectionNames) {
			const entries =
				this.#externalStore && externalIds.has(collectionName)
					? this.#externalStore.scopedStore(collectionName).values({ content: false })
					: this.#store.values(collectionName);
			for await (const entry of entries) {
				if (entry?.data) {
					this.#findInvalidReferences(
						entry.data,
						collectionNames,
						hasEntry,
						collectionName,
						entry.id,
						logger,
						'',
					);
				}
			}
		}
	}

	#findInvalidReferences(
		value: unknown,
		collectionNames: Set<string>,
		hasEntry: (collectionName: string, id: string) => boolean,
		ownerCollection: string,
		ownerId: string,
		logger: { error(message: string): void },
		path: string,
	) {
		if (value == null || typeof value !== 'object') return;

		if (Array.isArray(value)) {
			for (let i = 0; i < value.length; i++) {
				this.#findInvalidReferences(
					value[i],
					collectionNames,
					hasEntry,
					ownerCollection,
					ownerId,
					logger,
					`${path}[${i}]`,
				);
			}
			return;
		}

		const obj = value as Record<string, unknown>;
		// A reference object has `id` (or `slug`) and `collection` string fields
		if (typeof obj.collection === 'string' && collectionNames.has(obj.collection)) {
			const refId =
				typeof obj.id === 'string' ? obj.id : typeof obj.slug === 'string' ? obj.slug : undefined;
			if (refId !== undefined && !hasEntry(obj.collection, refId)) {
				const fieldPath = path ? ` (field: ${path})` : '';
				logger.error(
					`Invalid content reference: entry "${ownerId}" in collection "${ownerCollection}"${fieldPath} references "${refId}" in collection "${obj.collection}", but that entry does not exist.`,
				);
			}
			return;
		}

		for (const [key, val] of Object.entries(obj)) {
			this.#findInvalidReferences(
				val,
				collectionNames,
				hasEntry,
				ownerCollection,
				ownerId,
				logger,
				path ? `${path}.${key}` : key,
			);
		}
	}

	async regenerateCollectionFileManifest() {
		const collectionsManifest = new URL(COLLECTIONS_MANIFEST_FILE, this.#settings.dotAstroDir);
		this.#logger.debug('content', 'Regenerating collection file manifest');
		if (existsSync(collectionsManifest)) {
			try {
				const collections = await fs.readFile(collectionsManifest, 'utf-8');
				const collectionsJson = JSON.parse(collections);
				collectionsJson.entries ??= {};

				for (const { hasSchema, name } of collectionsJson.collections) {
					if (!hasSchema) {
						continue;
					}
					if (this.#externalStore && this.#externalCollectionNames.includes(name)) {
						const externalEntries = this.#externalStore
							.scopedStore(name)
							.values({ content: false });
						for await (const { filePath } of externalEntries) {
							if (filePath) {
								const key = new URL(filePath, this.#settings.config.root).href.toLowerCase();
								collectionsJson.entries[key] = name;
							}
						}
						continue;
					}
					const entries = this.#store.values(name);
					if (!entries?.[0]?.filePath) {
						continue;
					}
					for (const { filePath } of entries) {
						if (!filePath) {
							continue;
						}
						const key = new URL(filePath, this.#settings.config.root).href.toLowerCase();
						collectionsJson.entries[key] = name;
					}
				}
				await fs.writeFile(collectionsManifest, JSON.stringify(collectionsJson, null, 2));
			} catch {
				this.#logger.error('content', 'Failed to regenerate collection file manifest');
			}
		}
		this.#logger.debug('content', 'Regenerated collection file manifest');
	}
}

async function simpleLoader<TData extends { id: string }>(
	handler: CollectionLoader<TData>,
	context: LoaderContext,
) {
	const data = await loadSimpleLoaderData(handler, context.collection);
	context.store.clear();
	for await (const entry of parseSimpleLoaderEntries(data, context)) {
		context.store.set(entry);
	}
}

/**
 * Saves the entries returned by the inline loader of a collection defined with
 * `storage: 'external'`. Instead of clearing the collection first, it removes the entries
 * that weren't returned, so the collection stays readable while it's loaded.
 */
async function externalSimpleLoader<TData extends { id: string }>(
	handler: CollectionLoader<TData>,
	context: ExternalLoaderContext,
) {
	const data = await loadSimpleLoaderData(handler, context.collection);
	const removedIds = new Set(await context.store.keys());
	for await (const entry of parseSimpleLoaderEntries(data, context)) {
		removedIds.delete(entry.id);
		await context.store.set(entry);
	}
	for (const id of removedIds) {
		await context.store.delete(id);
	}
}

/**
 * Calls the inline loader of a collection and checks the shape of what it returns.
 *
 * @throws {AstroError} `ContentLoaderReturnsInvalidId` when an entry has an invalid ID.
 */
async function loadSimpleLoaderData<TData extends { id: string }>(
	handler: CollectionLoader<TData>,
	collection: string,
) {
	const unsafeData = await handler();
	const parsedData = loaderReturnSchema.safeParse(unsafeData);

	if (!parsedData.success) {
		const issue = parsedData.error.issues[0] as z.core.$ZodIssueInvalidUnion;

		// Due to this being a union, zod will always throw an "Expected array, received object" error along with the other errors.
		// This error is in the second position if the data is an array, and in the first position if the data is an object.
		const parseIssue = Array.isArray(unsafeData) ? issue.errors[0] : issue.errors[1];

		const error = parseIssue[0];
		const firstPathItem = error.path[0];

		const entry = Array.isArray(unsafeData)
			? unsafeData[firstPathItem as number]
			: unsafeData[firstPathItem as string];

		throw new AstroError({
			...AstroErrorData.ContentLoaderReturnsInvalidId,
			message: AstroErrorData.ContentLoaderReturnsInvalidId.message(collection, entry),
		});
	}

	return parsedData.data;
}

/**
 * Validates and parses, one at a time, the entries returned by the inline loader of a collection.
 *
 * @throws {AstroError} `ContentLoaderInvalidDataError` when an entry has no ID, or an ID that
 * doesn't match its key.
 */
async function* parseSimpleLoaderEntries(
	data: z.infer<typeof loaderReturnSchema>,
	context: Pick<LoaderContext, 'collection' | 'parseData'>,
) {
	if (Array.isArray(data)) {
		for (const raw of data) {
			if (!raw.id) {
				throw new AstroError({
					...AstroErrorData.ContentLoaderInvalidDataError,
					message: AstroErrorData.ContentLoaderInvalidDataError.message(
						context.collection,
						`Entry missing ID:\n${JSON.stringify({ ...raw, id: undefined }, null, 2)}`,
					),
				});
			}
			const item = await context.parseData({ id: raw.id, data: raw });
			yield { id: raw.id, data: item };
		}
		return;
	}
	if (typeof data === 'object') {
		for (const [id, raw] of Object.entries(data)) {
			if (raw.id && raw.id !== id) {
				throw new AstroError({
					...AstroErrorData.ContentLoaderInvalidDataError,
					message: AstroErrorData.ContentLoaderInvalidDataError.message(
						context.collection,
						`Object key ${JSON.stringify(id)} does not match ID ${JSON.stringify(raw.id)}`,
					),
				});
			}
			const item = await context.parseData({ id, data: raw });
			yield { id, data: item };
		}
		return;
	}
	throw new AstroError({
		...AstroErrorData.ExpectedImageOptions,
		message: AstroErrorData.ContentLoaderInvalidDataError.message(
			context.collection,
			`Invalid data type: ${typeof data}`,
		),
	});
}
