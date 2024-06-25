import type { AstroSettings } from '../@types/astro.js';
import type { Logger } from '../core/logger/core.js';
import { globalDataStore, type DataStore } from './data-store.js';
import { globalContentConfigObserver } from './utils.js';

export async function syncDataLayer({
	settings,
	logger,
	store = globalDataStore.get(),
}: { settings: AstroSettings; logger: Logger; store?: DataStore }) {

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
				cache: {},
			});
		})
	);
}
