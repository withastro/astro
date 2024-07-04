import { promises as fs, existsSync } from 'fs';
import type { FSWatcher } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import type { Logger } from '../core/logger/core.js';
import { DATA_STORE_FILE } from './consts.js';
import { DataStore, globalDataStore } from './data-store.js';
import type { DataWithId, LoaderContext } from './loaders/types.js';
import { getEntryData, globalContentConfigObserver } from './utils.js';
export interface SyncContentLayerOptions {
	store?: DataStore;
	settings: AstroSettings;
	logger: Logger;
	watcher?: FSWatcher;
}

/**
 * Run the `load()` method of each collection's loader, which will load the data and save it in the data store.
 * The loader itself is responsible for deciding whether this will clear and reload the full collection, or
 * perform an incremental update. After the data is loaded, the data store is written to disk.
 */
export async function syncContentLayer({
	settings,
	logger: globalLogger,
	store,
	watcher,
}: SyncContentLayerOptions) {
	// The default max listeners is 10, which can be exceeded when using a lot of loaders
	watcher?.setMaxListeners(50);

	const logger = globalLogger.forkIntegrationLogger('content');
	logger.info('Syncing content');
	if (!store) {
		store = await DataStore.fromDisk(new URL(DATA_STORE_FILE, settings.config.cacheDir));
		globalDataStore.set(store);
	}
	const contentConfig = globalContentConfigObserver.get();
	if (contentConfig?.status !== 'loaded') {
		logger.debug('Content config not loaded, skipping sync');
		return;
	}
	await Promise.all(
		Object.entries(contentConfig.config.collections).map(async ([name, collection]) => {
			if (collection.type !== 'experimental_data') {
				return;
			}

			let { schema } = collection;

			if (!schema && typeof collection.loader === 'object') {
				schema = collection.loader.schema;
			}

			if (typeof schema === 'function') {
				schema = await schema({
					image: () => {
						throw new Error('Images are currently not supported for experimental data collections');
					},
				});
			}

			const collectionWithResolvedSchema = { ...collection, schema };

			const parseData: LoaderContext['parseData'] = ({ id, data, filePath = '' }) =>
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
					collectionWithResolvedSchema,
					false
				) as Promise<DataWithId>;

			const payload: LoaderContext = {
				collection: name,
				store: store.scopedStore(name),
				meta: store.metaStore(name),
				logger: globalLogger.forkIntegrationLogger(collection.loader.name ?? 'content'),
				settings,
				parseData,
				watcher,
			};

			if (typeof collection.loader === 'function') {
				return simpleLoader(collection.loader, payload);
			}

			if (!collection.loader.load) {
				throw new Error(`Collection loader for ${name} does not have a load method`);
			}

			return collection.loader.load(payload);
		})
	);
	const cacheFile = new URL(DATA_STORE_FILE, settings.config.cacheDir);
	if (!existsSync(settings.config.cacheDir)) {
		await fs.mkdir(settings.config.cacheDir, { recursive: true });
	}
	await store.writeToDisk(cacheFile);
	logger.info('Synced content');
}

export async function simpleLoader(
	handler: () => Array<DataWithId> | Promise<Array<DataWithId>>,
	context: LoaderContext
) {
	const data = await handler();
	context.store.clear();
	for (const raw of data) {
		const item = await context.parseData({ id: raw.id, data: raw });
		context.store.set(raw.id, item);
	}
}
