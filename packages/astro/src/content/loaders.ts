import type { AstroSettings } from '../@types/astro.js';
import type { Logger } from '../core/logger/core.js';
import { DataStore, globalDataStore } from './data-store.js';
import { globalContentConfigObserver } from './utils.js';

export async function syncDataLayer({
	settings,
	logger,
	store,
}: { settings: AstroSettings; logger: Logger; store?: DataStore }) {
	if (!store) {
		store = await DataStore.fromDisk(new URL('data-store.json', settings.config.cacheDir));
		globalDataStore.set(store);
	}
	const contentConfig = globalContentConfigObserver.get();
	if (contentConfig?.status !== 'loaded') {
		logger.debug('content', 'Content config not loaded, skipping sync');
		return;
	}
	await Promise.all(
		Object.entries(contentConfig.config.collections).map(async ([name, collection]) => {
			if (collection.type !== 'experimental_data') {
				return;
			}
			return collection.loader.load({
				collection: name,
				store: store.scopedStore(name),
				meta: store.metaStore(name),
				logger: logger.forkIntegrationLogger('content'),
			});
		})
	);
	const cacheFile = new URL('data-store.json', settings.config.cacheDir);
	await store.writeToDisk(cacheFile);
	logger.info(null, 'Synced data layer');
}
