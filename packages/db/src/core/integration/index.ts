import type { AstroIntegration } from 'astro';
import { vitePluginDb } from './vite-plugin-db.js';
import { vitePluginInjectEnvTs } from './vite-plugin-inject-env-ts.js';
import { typegen } from './typegen.js';
import { existsSync } from 'fs';
import { mkdir, rm, writeFile } from 'fs/promises';
import { CONFIG_FILE_NAMES, DB_PATH } from '../consts.js';
import { createLocalDatabaseClient } from '../../runtime/db-client.js';
import { dbConfigSchema, type DBTables } from '../types.js';
import { getDbDirUrl, type VitePlugin } from '../utils.js';
import { UNSAFE_DISABLE_STUDIO_WARNING } from '../errors.js';
import { errorMap } from './error-map.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { blue, yellow } from 'kleur/colors';
import { fileURLIntegration } from './file-url.js';
import { recreateTables } from '../../runtime/queries.js';
import { getManagedAppTokenOrExit, type ManagedAppToken } from '../tokens.js';
import { loadConfigFile } from '../load-file.js';

function astroDBIntegration(): AstroIntegration {
	let connectToStudio = false;
	let configFileDependencies: string[] = [];
	let root: URL;
	let appToken: ManagedAppToken | undefined;
	let schemas = {
		tables(): DBTables {
			throw new Error('tables not found');
		},
	};
	let command: 'dev' | 'build' | 'preview';
	return {
		name: 'astro:db',
		hooks: {
			'astro:config:setup': async ({ updateConfig, config, command: _command, logger }) => {
				command = _command;
				root = config.root;
				if (_command === 'preview') return;

				let dbPlugin: VitePlugin | undefined = undefined;

				const unsafeDisableStudio =
					config.db?.unsafeDisableStudio ?? process.env.ASTRO_DB_TEST_ENV === '1';

				if (unsafeDisableStudio) {
					logger.warn(UNSAFE_DISABLE_STUDIO_WARNING);
				}

				connectToStudio = command === 'build' && !unsafeDisableStudio;

				if (connectToStudio) {
					appToken = await getManagedAppTokenOrExit();
					dbPlugin = vitePluginDb({
						connectToStudio,
						appToken: appToken.token,
						schemas,
						root: config.root,
					});
				} else {
					dbPlugin = vitePluginDb({
						connectToStudio,
						schemas,
						root: config.root,
						shouldSeed: command === 'dev',
					});
				}

				updateConfig({
					vite: {
						assetsInclude: [DB_PATH],
						plugins: [dbPlugin, vitePluginInjectEnvTs(config, logger)],
					},
				});
			},
			'astro:config:done': async ({ config, logger }) => {
				// TODO: refine where we load tables
				// @matthewp: may want to load tables by path at runtime
				const { mod, dependencies } = await loadConfigFile(config.root);
				configFileDependencies = dependencies;

				const { tables = {} } = dbConfigSchema.parse(mod?.default ?? {}, { errorMap });
				// Redefine getTables so our integration can grab them
				schemas.tables = () => tables;

				if (!connectToStudio) {
					const dbUrl = new URL(DB_PATH, config.root);
					if (existsSync(dbUrl)) {
						await rm(dbUrl);
					}
					await mkdir(dirname(fileURLToPath(dbUrl)), { recursive: true });
					await writeFile(dbUrl, '');

					using db = await createLocalDatabaseClient({
						dbUrl: dbUrl.toString(),
					});
					await recreateTables({ db, tables });
					logger.debug('Database setup complete.');
				}

				await typegen({ tables, root: config.root });
			},
			'astro:server:start': async ({ logger }) => {
				// Wait for the server startup to log, so that this can come afterwards.
				setTimeout(() => {
					logger.info(
						connectToStudio ? 'Connected to remote database.' : 'New local database created.'
					);
				}, 100);
			},
			'astro:server:setup': async ({ server }) => {
				const filesToWatch = [
					...CONFIG_FILE_NAMES.map((c) => new URL(c, getDbDirUrl(root))),
					...configFileDependencies.map((c) => new URL(c, root)),
				];
				server.watcher.on('all', (event, relativeEntry) => {
					const entry = new URL(relativeEntry, root);
					if (filesToWatch.some((f) => entry.href === f.href)) {
						server.restart();
					}
				});
			},
			'astro:build:start': async ({ logger }) => {
				logger.info('database: ' + (connectToStudio ? yellow('remote') : blue('local database.')));
			},
			'astro:build:done': async ({}) => {
				await appToken?.destroy();
			},
		},
	};
}

export function integration(): AstroIntegration[] {
	return [astroDBIntegration(), fileURLIntegration()];
}
