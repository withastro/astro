import type { ZodSchema } from 'zod';
import type { AstroSettings } from '../@types/astro.js';
import type { AstroIntegrationLogger, Logger } from '../core/logger/core.js';
import { DataStore, globalDataStore, type MetaStore, type ScopedDataStore } from './data-store.js';
import { getEntryData, globalContentConfigObserver } from './utils.js';
import { promises as fs, existsSync } from 'fs';

export interface ParseDataOptions {
	/** The ID of the entry. Unique per collection */
	id: string;
	/** The raw, unvalidated data of the entry */
	data: Record<string, unknown>;
	/** An optional file path, where the entry represents a local file */
	filePath?: string;
}

export interface LoaderContext {
	collection: string;
	/** A database abstraction to store the actual data */
	store: ScopedDataStore;
	/**  A simple KV store, designed for things like sync tokens */
	meta: MetaStore;
	logger: AstroIntegrationLogger;

	settings: AstroSettings;

	/** Validates and parses the data according to the schema */
	parseData<T extends Record<string, unknown> = Record<string, unknown>>(
		props: ParseDataOptions
	): T;
}

export interface Loader {
	/** Unique name of the loader, e.g. the npm package name */
	name: string;
	/** Do the actual loading of the data */
	load: (context: LoaderContext) => Promise<void>;
	/** Optionally, define the schema of the data. Will be overridden by user-defined schema */
	schema?: ZodSchema | Promise<ZodSchema> | (() => ZodSchema | Promise<ZodSchema>);
	render?: (entry: any) => any;
}
export async function syncDataLayer({
	settings,
	logger: globalLogger,
	store,
}: { settings: AstroSettings; logger: Logger; store?: DataStore }) {
	const logger = globalLogger.forkIntegrationLogger('content');
	if (!store) {
		store = await DataStore.fromDisk(new URL('data-store.json', settings.config.cacheDir));
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

			if (!schema) {
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

			function parseData<T extends Record<string, unknown> = Record<string, unknown>>({
				id,
				data,
				filePath = '',
			}: { id: string; data: T; filePath?: string }): T {
				return getEntryData(
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
				) as unknown as T;
			}

			return collection.loader.load({
				collection: name,
				store: store.scopedStore(name),
				meta: store.metaStore(name),
				logger,
				settings,
				parseData,
			});
		})
	);
	const cacheFile = new URL('data-store.json', settings.config.cacheDir);
	if (!existsSync(settings.config.cacheDir)) {
		await fs.mkdir(settings.config.cacheDir, { recursive: true });
	}
	await store.writeToDisk(cacheFile);
	logger.info('Synced content');
}
