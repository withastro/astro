import type { ZodSchema } from 'zod';
import type { AstroSettings } from '../@types/astro.js';
import type { AstroIntegrationLogger, Logger } from '../core/logger/core.js';
import { DataStore, globalDataStore, type MetaStore, type ScopedDataStore } from './data-store.js';
import { globalContentConfigObserver } from './utils.js';
import { promises as fs, existsSync } from 'fs';

export interface LoaderContext {
	collection: string;
	// A database abstraction to store the actual data
	store: ScopedDataStore;
	// A simple KV store, designed for things like sync tokens
	meta: MetaStore;
	logger: AstroIntegrationLogger;

	settings: AstroSettings;
}

export interface Loader<S extends ZodSchema = ZodSchema> {
	// Name of the loader, e.g. the npm package name
	name: string;
	// Do the actual loading of the data
	load: (context: LoaderContext) => Promise<void>;
	// Allow a loader to define its own schema
	schema?: S | Promise<S> | (() => S | Promise<S>);
	// Render content from the store
	render?: (entry: any) => any;
}
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
				settings,
			});
		})
	);
	const cacheFile = new URL('data-store.json', settings.config.cacheDir);
	if (!existsSync(settings.config.cacheDir)) {
		await fs.mkdir(settings.config.cacheDir, { recursive: true });
	}
	await store.writeToDisk(cacheFile);
	logger.info(null, 'Synced data layer');
}
