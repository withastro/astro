import type { AstroConfig, AstroIntegrationLogger } from 'astro';
import type { StoredCollections } from '../node/data-store.js';
import type { SqlExecutor, SyncOptions, SyncResult } from '../node/sync.js';

export interface SqliteDriverRuntime {
	/** A module exporting `createClient(options, context)` that returns a `SqliteClient`. Bundled into the server output. */
	entrypoint: string;
	/** Serialized into the server bundle and passed to `createClient()`. */
	options: Record<string, unknown>;
}

export interface SqliteDriverPushContext {
	config: AstroConfig;
	buildOutput: 'static' | 'server';
	logger: AstroIntegrationLogger;
	/** Absolute path of the local database, fully synced with the content layer. */
	databasePath: string;
	/** The content store snapshot the local database was synced from. */
	store: StoredCollections;
	syncOptions: SyncOptions;
	/** Incrementally syncs a target database with the content store. */
	sync(executor: SqlExecutor): Promise<SyncResult>;
	/** Statements that rebuild every mirrored table from scratch. */
	dump(): string[];
}

/**
 * Where the mirrored data lives once the site is deployed. A driver has two
 * halves: a runtime client used by the server bundle to read the data, and a
 * build-time `push()` that gets the data to wherever that client reads from.
 */
export interface SqliteDriver {
	name: string;
	runtime: SqliteDriverRuntime;
	push?(context: SqliteDriverPushContext): Promise<void>;
}
