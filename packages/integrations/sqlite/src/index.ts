import { fileURLToPath } from 'node:url';
import type { AstroConfig, AstroIntegration } from 'astro';
import { node } from './drivers/node.js';
import type { SqliteDriver } from './drivers/types.js';
import { getDataStorePaths } from './node/data-store.js';
import { LocalDatabase } from './node/local-database.js';
import { dumpCollections, syncCollections, type SyncOptions } from './node/sync.js';
import { Syncer } from './node/syncer.js';
import { vitePlugin } from './vite-plugin.js';

export { d1, type D1DriverOptions } from './drivers/d1.js';
export { node, type NodeDriverOptions } from './drivers/node.js';
export type {
	SqliteDriver,
	SqliteDriverPushContext,
	SqliteDriverRuntime,
} from './drivers/types.js';
export type { SqlExecutor, SyncOptions, SyncResult } from './node/sync.js';

export interface SqliteIntegrationOptions {
	/** Where the data is stored and read from once deployed. Defaults to a SQLite file next to the server bundle. */
	driver?: SqliteDriver;
	/** Only mirror these content collections. Defaults to all of them. */
	collections?: string[];
	/** Prefix of the tables created for each collection. Defaults to `content_`. */
	tablePrefix?: string;
}

export default function sqlite(options: SqliteIntegrationOptions = {}): AstroIntegration {
	const driver = options.driver ?? node();
	const syncOptions: SyncOptions = {
		tablePrefix: options.tablePrefix ?? 'content_',
		collections: options.collections,
	};

	let config: AstroConfig;
	let buildOutput: 'static' | 'server' = 'static';
	let database: LocalDatabase | undefined;
	let syncer: Syncer | undefined;

	function dispose() {
		syncer?.uninstall();
		database?.close();
		syncer = undefined;
		database = undefined;
	}

	return {
		name: '@astrojs/sqlite',
		hooks: {
			'astro:config:setup': ({ command, updateConfig }) => {
				updateConfig({
					vite: {
						plugins: [vitePlugin({ driver, tablePrefix: syncOptions.tablePrefix, command })],
						// The loader imports a virtual module, so it has to go through Vite.
						ssr: { noExternal: ['@astrojs/sqlite'] },
					},
				});
			},
			'astro:config:done': (context) => {
				config = context.config;
				buildOutput = context.buildOutput;
			},
			'astro:server:setup': async ({ server, logger }) => {
				dispose();
				const paths = getDataStorePaths(config, true);
				database = new LocalDatabase(new URL('astro-sqlite/dev.db', config.cacheDir));
				syncer = new Syncer({ ...syncOptions, database, paths, logger });
				syncer.install();

				const commitFile = fileURLToPath(paths.commitFile);
				const onStoreWritten = (file: string) => {
					if (file !== commitFile) return;
					syncer?.sync().catch((error) => {
						logger.error(`Failed to sync content to SQLite: ${error.message}`);
					});
				};
				server.watcher.on('change', onStoreWritten);
				server.watcher.on('add', onStoreWritten);
				await syncer.sync();
			},
			'astro:server:done': dispose,
			'astro:build:start': async ({ logger }) => {
				dispose();
				const paths = getDataStorePaths(config, false);
				database = new LocalDatabase(new URL('astro-sqlite/build.db', config.cacheDir));
				syncer = new Syncer({ ...syncOptions, database, paths, logger });
				await syncer.sync();
				syncer.install();
			},
			'astro:build:done': async ({ logger }) => {
				if (!database || !syncer) return;
				const store = syncer.store;
				try {
					if (buildOutput === 'server' && driver.push) {
						await driver.push({
							config,
							buildOutput,
							logger,
							databasePath: database.path,
							store,
							syncOptions,
							sync: (executor) => syncCollections(executor, store, syncOptions),
							dump: () => dumpCollections(store, syncOptions),
						});
					}
				} finally {
					dispose();
				}
			},
		},
	};
}
