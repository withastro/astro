import { promises as fs } from 'node:fs';
import type { AstroIntegrationLogger } from 'astro';
import { LOCAL_CLIENT_PROVIDER_KEY, type LocalClientProvider } from '../runtime/types.js';
import { type DataStorePaths, readDataStore, type StoredCollections } from './data-store.js';
import type { LocalDatabase } from './local-database.js';
import { type SyncOptions, syncCollections } from './sync.js';

export interface SyncerOptions extends SyncOptions {
	database: LocalDatabase;
	paths: DataStorePaths;
	logger: AstroIntegrationLogger;
}

/**
 * Keeps the local database in sync with the content layer's data store on disk.
 * A sync is triggered eagerly by the file watcher, and lazily by every query
 * through `ensureFresh()`, which compares the store's mtime with the last sync.
 * The lazy path is what makes a request that races the watcher still see fresh
 * data.
 */
export class Syncer {
	#options: SyncerOptions;
	#lastSignature: string | undefined;
	#running: Promise<void> | undefined;
	#queued = false;
	/** The store as of the last sync, so drivers can push it without re-reading the disk. */
	store: StoredCollections = new Map();

	constructor(options: SyncerOptions) {
		this.#options = options;
	}

	async #signature(): Promise<string | undefined> {
		try {
			const stat = await fs.stat(this.#options.paths.commitFile);
			return `${stat.mtimeMs}:${stat.size}`;
		} catch {
			return undefined;
		}
	}

	/** Syncs if the data store changed since the last sync. Concurrent calls share one run. */
	async ensureFresh(): Promise<void> {
		if (this.#running) {
			this.#queued = true;
			await this.#running;
			if (!this.#queued) return;
		}
		const signature = await this.#signature();
		if (signature === undefined || signature === this.#lastSignature) return;
		await this.sync();
	}

	/** Runs a sync now. */
	sync(): Promise<void> {
		if (this.#running) {
			this.#queued = true;
			return this.#running.then(() => (this.#queued ? this.sync() : undefined));
		}
		this.#queued = false;
		this.#running = this.#run().finally(() => {
			this.#running = undefined;
		});
		return this.#running;
	}

	async #run() {
		const { database, paths, logger, ...syncOptions } = this.#options;
		const signature = await this.#signature();
		const started = performance.now();
		const store = await readDataStore(paths);
		const result = await syncCollections(database.executor, store, syncOptions);
		this.store = store;
		this.#lastSignature = signature;
		if (result.changed) {
			const summary = Object.entries(result.collections)
				.filter(([, counts]) => counts.upserted > 0 || counts.deleted > 0)
				.map(([name, counts]) => `${name} (+${counts.upserted}/-${counts.deleted})`)
				.join(', ');
			logger.info(
				`Synced ${summary || 'tables'} to SQLite in ${Math.round(performance.now() - started)}ms`,
			);
		}
	}

	/** Exposes the local database to the loader, through a global the virtual client module reads. */
	install() {
		const provider: LocalClientProvider = {
			get: async () => {
				await this.ensureFresh();
				return this.#options.database.client;
			},
		};
		(globalThis as any)[LOCAL_CLIENT_PROVIDER_KEY] = provider;
	}

	uninstall() {
		delete (globalThis as any)[LOCAL_CLIENT_PROVIDER_KEY];
	}
}
