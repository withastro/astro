import type { AstroIntegrationLogger, AstroSettings } from '../../@types/astro.js';
import type { MetaStore, ScopedDataStore } from '../data-store.js';
import type { FSWatcher } from 'vite';
import type { ZodSchema } from 'zod';

export interface ParseDataOptions {
	/** The ID of the entry. Unique per collection */
	id: string;
	/** The raw, unvalidated data of the entry */
	data: Record<string, unknown>;
	/** An optional file path, where the entry represents a local file. */
	filePath?: string;
}

export type DataWithId = {
	id: string;
	[key: string]: unknown;
};

export interface LoaderContext {
	/** The unique name of the collection */
	collection: string;
	/** A database abstraction to store the actual data */
	store: ScopedDataStore;
	/**  A simple KV store, designed for things like sync tokens */
	meta: MetaStore;
	logger: AstroIntegrationLogger;

	settings: AstroSettings;

	/** Validates and parses the data according to the collection schema */
	parseData(props: ParseDataOptions): Promise<DataWithId>;

	/** When running in dev, this is a filesystem watcher that can be used to trigger updates */
	watcher?: FSWatcher;
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
