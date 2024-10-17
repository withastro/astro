import type { FSWatcher } from 'vite';
import type { ZodSchema } from 'zod';
import type { AstroConfig, AstroIntegrationLogger, ContentEntryType } from '../../@types/astro.js';
import type { MetaStore, ScopedDataStore } from '../mutable-data-store.js';

export interface ParseDataOptions<TData extends Record<string, unknown>> {
	/** The ID of the entry. Unique per collection */
	id: string;
	/** The raw, unvalidated data of the entry */
	data: TData;
	/** An optional file path, where the entry represents a local file. */
	filePath?: string;
}

export interface LoaderContext {
	/** The unique name of the collection */
	collection: string;
	/** A database abstraction to store the actual data */
	store: ScopedDataStore;
	/**  A simple KV store, designed for things like sync tokens */
	meta: MetaStore;
	logger: AstroIntegrationLogger;
	/** Astro config, with user config and merged defaults */
	config: AstroConfig;
	/** Validates and parses the data according to the collection schema */
	parseData<TData extends Record<string, unknown>>(props: ParseDataOptions<TData>): Promise<TData>;

	/** Generates a non-cryptographic content digest. This can be used to check if the data has changed */
	generateDigest(data: Record<string, unknown> | string): string;

	/** When running in dev, this is a filesystem watcher that can be used to trigger updates */
	watcher?: FSWatcher;

	refreshContextData?: Record<string, unknown>;
	entryTypes: Map<string, ContentEntryType>;
}

export interface Loader {
	/** Unique name of the loader, e.g. the npm package name */
	name: string;
	/** Do the actual loading of the data */
	load: (context: LoaderContext) => Promise<void>;
	/** Optionally, define the schema of the data. Will be overridden by user-defined schema */
	schema?: ZodSchema | Promise<ZodSchema> | (() => ZodSchema | Promise<ZodSchema>);
}
