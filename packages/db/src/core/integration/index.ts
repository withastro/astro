import type { AstroIntegration } from 'astro';
import { vitePluginDb } from './vite-plugin-db.js';
import { vitePluginInjectEnvTs } from './vite-plugin-inject-env-ts.js';
import { typegen } from './typegen.js';
import { existsSync } from 'fs';
import { mkdir, rm, writeFile } from 'fs/promises';
import { DB_PATH } from '../consts.js';
import { createLocalDatabaseClient } from '../../runtime/db-client.js';
import { astroConfigWithDbSchema } from '../types.js';
import { type VitePlugin } from '../utils.js';
import { STUDIO_CONFIG_MISSING_WRITABLE_COLLECTIONS_ERROR, UNSAFE_WRITABLE_WARNING } from '../errors.js';
import { errorMap } from './error-map.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { blue, yellow } from 'kleur/colors';
import { fileURLIntegration } from './file-url.js';
import { recreateTables, seedData } from '../queries.js';
import { getManagedAppTokenOrExit, type ManagedAppToken } from '../tokens.js';

function astroDBIntegration(): AstroIntegration {
	let connectedToRemote = false;
	let appToken: ManagedAppToken | undefined;
	return {
		name: 'astro:db',
		hooks: {
			'astro:config:setup': async ({ logger, updateConfig, config, command }) => {
				if (command === 'preview') return;

				// TODO: refine where we load collections
				// @matthewp: may want to load collections by path at runtime
				const configWithDb = astroConfigWithDbSchema.parse(config, { errorMap });
				const collections = configWithDb.db?.collections ?? {};

				const studio = configWithDb.db?.studio ?? false;
				const unsafeWritable = Boolean(configWithDb.db?.unsafeWritable);
				const foundWritableCollection = Object.entries(collections).find(([, c]) => c.writable);
				const writableAllowed = studio || unsafeWritable;
				if (!writableAllowed && foundWritableCollection) {
					logger.error(
						STUDIO_CONFIG_MISSING_WRITABLE_COLLECTIONS_ERROR(foundWritableCollection[0])
					);
					process.exit(1);
				}
				// Using writable collections with the opt-in flag. Warn them to let them
				// know the risk.
				else if(unsafeWritable && foundWritableCollection) {
					logger.warn(UNSAFE_WRITABLE_WARNING);
				}

				let dbPlugin: VitePlugin;
				if (studio && command === 'build' && process.env.ASTRO_DB_TEST_ENV !== '1') {
					appToken = await getManagedAppTokenOrExit();
					connectedToRemote = true;
					dbPlugin = vitePluginDb({
						connectToStudio: true,
						collections,
						appToken: appToken.token,
						root: config.root,
					});
				} else {
					const dbUrl = new URL(DB_PATH, config.root);
					if (existsSync(dbUrl)) {
						await rm(dbUrl);
					}
					await mkdir(dirname(fileURLToPath(dbUrl)), { recursive: true });
					await writeFile(dbUrl, '');

					const db = await createLocalDatabaseClient({
						collections,
						dbUrl: dbUrl.toString(),
						seeding: true,
					});
					await recreateTables({ db, collections });
					if (configWithDb.db?.data) {
						await seedData({
							db,
							data: configWithDb.db.data,
							logger,
							mode: command === 'dev' ? 'dev' : 'build',
						});
					}
					logger.debug('Database setup complete.');

					dbPlugin = vitePluginDb({
						connectToStudio: false,
						collections,
						root: config.root,
					});
				}

				updateConfig({
					vite: {
						assetsInclude: [DB_PATH],
						plugins: [
							dbPlugin,
							vitePluginInjectEnvTs(config),
							{
								name: 'my-plugin',
								resolveId(id) {
									if (id.endsWith('?server-path')) {
										//return id;
									}
								},
								load(id) {
									if (id.endsWith('?server-path')) {
									}
								},
							},
						],
					},
				});
				await typegen({ collections, root: config.root });
			},
			'astro:server:start': async ({ logger }) => {
				// Wait for the server startup to log, so that this can come afterwards.
				setTimeout(() => {
					logger.info(
						connectedToRemote ? 'Connected to remote database.' : 'New local database created.'
					);
				}, 100);
			},
			'astro:build:start': async ({ logger }) => {
				logger.info(
					'database: ' + (connectedToRemote ? yellow('remote') : blue('local database.'))
				);
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
