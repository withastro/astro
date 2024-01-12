import type { AstroIntegration } from 'astro';
import { vitePluginDb } from './vite-plugin-db.js';
import { vitePluginInjectEnvTs } from './vite-plugin-inject-env-ts.js';
import { typegen } from './typegen.js';
import { collectionsSchema } from './types.js';
import { existsSync } from 'fs';
import { rm } from 'fs/promises';
import { getDbUrl } from './consts.js';
import { createDb, setupDbTables } from './internal.js';

export function integration(): AstroIntegration {
	return {
		name: 'astro:db',
		hooks: {
			async 'astro:config:setup'({ logger, updateConfig, config, command }) {
				if (command === 'preview') return;

				// TODO: refine where we load collections
				// @matthewp: may want to load collections by path at runtime
				const collections = collectionsSchema.parse(config.db?.collections ?? {});
				const dbUrl = getDbUrl(config.root);
				if (existsSync(dbUrl)) {
					await rm(dbUrl);
				}
				const db = await createDb({ collections, dbUrl: dbUrl.href, seeding: true });
				await setupDbTables({ db, collections, logger });
				logger.info('Collections set up 🚀');

				updateConfig({
					vite: {
						plugins: [
							// TODO: figure out when vite.Plugin doesn't line up with these types
							// @ts-ignore
							vitePluginDb({
								collections,
								root: config.root,
							}),
							// @ts-ignore
							vitePluginInjectEnvTs(config),
						],
					},
				});
				await typegen({ collections, root: config.root });
			},
		},
	};
}
