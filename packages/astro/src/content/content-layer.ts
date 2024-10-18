import { promises as fs, existsSync } from 'node:fs';
import PQueue from 'p-queue';
import type { FSWatcher } from 'vite';
import xxhash from 'xxhash-wasm';
import type { AstroSettings, ContentEntryType, RefreshContentOptions } from '../@types/astro.js';
import { AstroUserError } from '../core/errors/errors.js';
import type { Logger } from '../core/logger/core.js';
import {
	ASSET_IMPORTS_FILE,
	CONTENT_LAYER_TYPE,
	DATA_STORE_FILE,
	MODULES_IMPORTS_FILE,
} from './consts.js';
import type { LoaderContext } from './loaders/types.js';
import type { MutableDataStore } from './mutable-data-store.js';
import {
	getEntryConfigByExtMap,
	getEntryDataAndImages,
	globalContentConfigObserver,
} from './utils.js';

export interface ContentLayerOptions {
	store: MutableDataStore;
	settings: AstroSettings;
	logger: Logger;
	watcher?: FSWatcher;
}

export class ContentLayer {
	#logger: Logger;
	#store: MutableDataStore;
	#settings: AstroSettings;
	#watcher?: FSWatcher;
	#lastConfigDigest?: string;
	#unsubscribe?: () => void;

	#generateDigest?: (data: Record<string, unknown> | string) => string;

	#queue: PQueue;

	constructor({ settings, logger, store, watcher }: ContentLayerOptions) {
		// The default max listeners is 10, which can be exceeded when using a lot of loaders
		watcher?.setMaxListeners(50);

		this.#logger = logger;
		this.#store = store;
		this.#settings = settings;
		this.#watcher = watcher;
		this.#queue = new PQueue({ concurrency: 1 });
	}

	/**
	 * Whether the content layer is currently loading content
	 */
	get loading() {
		return this.#queue.size > 0 || this.#queue.pending > 0;
	}

	/**
	 * Watch for changes to the content config and trigger a sync when it changes.
	 */
	watchContentConfig() {
		this.#unsubscribe?.();
		this.#unsubscribe = globalContentConfigObserver.subscribe(async (ctx) => {
			if (ctx.status === 'loaded' && ctx.config.digest !== this.#lastConfigDigest) {
				this.sync();
			}
		});
	}

	unwatchContentConfig() {
		this.#unsubscribe?.();
	}

	async #getGenerateDigest() {
		if (this.#generateDigest) {
			return this.#generateDigest;
		}
		// xxhash is a very fast non-cryptographic hash function that is used to generate a content digest
		// It uses wasm, so we need to load it asynchronously.
		const { h64ToString } = await xxhash();

		this.#generateDigest = (data: Record<string, unknown> | string) => {
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
			generateDigest: await this.#getGenerateDigest(),
			watcher: this.#watcher,
			refreshContextData,
			entryTypes: getEntryConfigByExtMap([
				...this.#settings.contentEntryTypes,
				...this.#settings.dataEntryTypes,
			] as Array<ContentEntryType>),
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
		const contentConfig = globalContentConfigObserver.get();
		const logger = this.#logger.forkIntegrationLogger('content');
		if (contentConfig?.status !== 'loaded') {
			logger.debug('Content config not loaded, skipping sync');
			return;
		}
		if (!this.#settings.config.experimental.contentLayer) {
			const contentLayerCollections = Object.entries(contentConfig.config.collections).filter(
				([_, collection]) => collection.type === CONTENT_LAYER_TYPE,
			);
			if (contentLayerCollections.length > 0) {
				throw new AstroUserError(
					`The following collections have a loader defined, but the content layer is not enabled: ${contentLayerCollections.map(([title]) => title).join(', ')}.`,
					'To enable the Content Layer API, set `experimental: { contentLayer: true }` in your Astro config file.',
				);
			}
			return;
		}

		logger.info('Syncing content');
		const { digest: currentConfigDigest } = contentConfig.config;
		this.#lastConfigDigest = currentConfigDigest;

		let shouldClear = false;
		const previousConfigDigest = await this.#store.metaStore().get('config-digest');
		const previousAstroVersion = await this.#store.metaStore().get('astro-version');
		if (currentConfigDigest && previousConfigDigest !== currentConfigDigest) {
			logger.info('Content config changed');
			shouldClear = true;
		}
		if (process.env.ASTRO_VERSION && previousAstroVersion !== process.env.ASTRO_VERSION) {
			logger.info('Astro version changed');
			shouldClear = true;
		}
		if (shouldClear) {
			logger.info('Clearing content store');
			this.#store.clearAll();
		}
		if (process.env.ASTRO_VERSION) {
			await this.#store.metaStore().set('astro-version', process.env.ASTRO_VERSION);
		}
		if (currentConfigDigest) {
			await this.#store.metaStore().set('config-digest', currentConfigDigest);
		}
		await Promise.all(
			Object.entries(contentConfig.config.collections).map(async ([name, collection]) => {
				if (collection.type !== CONTENT_LAYER_TYPE) {
					return;
				}

				let { schema } = collection;

				if (!schema && typeof collection.loader === 'object') {
					schema = collection.loader.schema;
					if (typeof schema === 'function') {
						schema = await schema();
					}
				}

				// If loaders are specified, only sync the specified loaders
				if (
					options?.loaders &&
					(typeof collection.loader !== 'object' ||
						!options.loaders.includes(collection.loader.name))
				) {
					return;
				}

				const collectionWithResolvedSchema = { ...collection, schema };

				const parseData: LoaderContext['parseData'] = async ({ id, data, filePath = '' }) => {
					const { data: parsedData } = await getEntryDataAndImages(
						{
							id,
							collection: name,
							unvalidatedData: data,
							_internal: {
								rawData: undefined,
								filePath,
							},
						},
						collectionWithResolvedSchema,
						false,
					);

					return parsedData;
				};

				const context = await this.#getLoaderContext({
					collectionName: name,
					parseData,
					loaderName: collection.loader.name,
					refreshContextData: options?.context,
				});

				if (typeof collection.loader === 'function') {
					return simpleLoader(collection.loader, context);
				}

				if (!collection.loader.load) {
					throw new Error(`Collection loader for ${name} does not have a load method`);
				}

				return collection.loader.load(context);
			}),
		);
		if (!existsSync(this.#settings.config.cacheDir)) {
			await fs.mkdir(this.#settings.config.cacheDir, { recursive: true });
		}
		const cacheFile = getDataStoreFile(this.#settings);
		await this.#store.writeToDisk(cacheFile);
		if (!existsSync(this.#settings.dotAstroDir)) {
			await fs.mkdir(this.#settings.dotAstroDir, { recursive: true });
		}
		const assetImportsFile = new URL(ASSET_IMPORTS_FILE, this.#settings.dotAstroDir);
		await this.#store.writeAssetImports(assetImportsFile);
		const modulesImportsFile = new URL(MODULES_IMPORTS_FILE, this.#settings.dotAstroDir);
		await this.#store.writeModuleImports(modulesImportsFile);
		logger.info('Synced content');
		if (this.#settings.config.experimental.contentIntellisense) {
			await this.regenerateCollectionFileManifest();
		}
	}

	async regenerateCollectionFileManifest() {
		const collectionsManifest = new URL('collections/collections.json', this.#settings.dotAstroDir);
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

export async function simpleLoader<TData extends { id: string }>(
	handler: () => Array<TData> | Promise<Array<TData>>,
	context: LoaderContext,
) {
	const data = await handler();
	context.store.clear();
	for (const raw of data) {
		const item = await context.parseData({ id: raw.id, data: raw });
		context.store.set({ id: raw.id, data: item });
	}
}
/**
 * Get the path to the data store file.
 * During development, this is in the `.astro` directory so that the Vite watcher can see it.
 * In production, it's in the cache directory so that it's preserved between builds.
 */
export function getDataStoreFile(settings: AstroSettings, isDev?: boolean) {
	isDev ??= process?.env.NODE_ENV === 'development';
	return new URL(DATA_STORE_FILE, isDev ? settings.dotAstroDir : settings.config.cacheDir);
}

function contentLayerSingleton() {
	let instance: ContentLayer | null = null;
	return {
		init: (options: ContentLayerOptions) => {
			instance?.unwatchContentConfig();
			instance = new ContentLayer(options);
			return instance;
		},
		get: () => instance,
		dispose: () => {
			instance?.unwatchContentConfig();
			instance = null;
		},
	};
}

export const globalContentLayer = contentLayerSingleton();
