import type { AstroIntegration } from 'astro';
import { vitePluginDb } from './vite-plugin-db.js';
import { vitePluginInjectEnvTs } from './vite-plugin-inject-env-ts.js';
import { typegen } from './typegen.js';
import { existsSync } from 'fs';
import { mkdir, rm, writeFile } from 'fs/promises';
import { DB_PATH } from '../consts.js';
import { createLocalDatabaseClient } from '../../runtime/db-client.js';
import { astroConfigWithDbSchema } from '../types.js';
import { getAstroStudioEnv, type VitePlugin } from '../utils.js';
import { appTokenError } from '../errors.js';
import { errorMap } from './error-map.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { bold } from 'kleur/colors';
import { fileURLIntegration } from './file-url.js';
import { setupDbTables } from '../queries.js';
import { collectionToTable } from '../../runtime/index.js';

function astroDBIntegration(): AstroIntegration {
	return {
		name: 'astro:db',
		hooks: {
			async 'astro:config:setup'({ logger, updateConfig, config, command }) {
				if (command === 'preview') return;

				// TODO: refine where we load collections
				// @matthewp: may want to load collections by path at runtime
				const configWithDb = astroConfigWithDbSchema.parse(config, { errorMap });
				const collections = configWithDb.db?.collections ?? {};
				setCollectionsMeta(collections);

				const studio = configWithDb.db?.studio ?? false;
				if (!studio && Object.values(collections).some((c) => c.writable)) {
					logger.warn(
						`Writable collections should only be used with Astro Studio. Did you set the ${bold(
							'studio'
						)} flag in your astro config?`
					);
				}

				let dbPlugin: VitePlugin;
				if (studio && command === 'build') {
					const appToken = getAstroStudioEnv().ASTRO_STUDIO_APP_TOKEN;
					if (!appToken) {
						logger.error(appTokenError);
						process.exit(0);
					}
					dbPlugin = vitePluginDb({
						connectToStudio: true,
						collections,
						appToken,
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
					await setupDbTables({
						db,
						collections,
						data: configWithDb.db?.data,
						logger,
						mode: command === 'dev' ? 'dev' : 'build',
					});
					logger.info('Collections set up 🚀');

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
		},
	};
}

/**
 * We need to attach the Drizzle `table` and collection name at runtime.
 * These cannot be determined from `defineCollection()`,
 * since we don't know the collection name until the `db` config is resolved.
 */
function setCollectionsMeta(collections: Record<string, any>) {
	for (const [name, collection] of Object.entries(collections)) {
		const table = collectionToTable(name, collection);
		collection._setMeta?.({ table });
	}
}

export function integration(): AstroIntegration[] {
	return [astroDBIntegration(), fileURLIntegration()];
}
