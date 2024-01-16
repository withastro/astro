import type { AstroIntegration } from 'astro';
import { vitePluginDb } from './vite-plugin-db.js';
import { vitePluginInjectEnvTs } from './vite-plugin-inject-env-ts.js';
import { typegen } from './typegen.js';
import { existsSync } from 'fs';
import { rm } from 'fs/promises';
import { getLocalDbUrl } from './consts.js';
import { createDb, setupDbTables } from './internal.js';
import { astroConfigWithDbSchema } from './config.js';
import { getAstroStudioEnv, type VitePlugin } from './utils.js';
import { appTokenError } from './errors.js';

export function integration(): AstroIntegration {
	return {
		name: 'astro:db',
		hooks: {
			async 'astro:config:setup'({ logger, updateConfig, config, command }) {
				if (command === 'preview') return;

				// TODO: refine where we load collections
				// @matthewp: may want to load collections by path at runtime
				const configWithDb = astroConfigWithDbSchema.parse(config);
				const collections = configWithDb.db?.collections ?? {};
				const studio = configWithDb.db?.studio ?? false;

				let dbPlugin: VitePlugin;
				if (studio && command === 'build') {
					const appToken = getAstroStudioEnv().ASTRO_STUDIO_APP_TOKEN;
					if (!appToken) {
						logger.error(appTokenError);
						process.exit(0);
					}
					dbPlugin = vitePluginDb({ connectToStudio: true, collections, appToken });
				} else {
					const dbUrl = getLocalDbUrl(config.root).href;
					if (existsSync(dbUrl)) {
						await rm(dbUrl);
					}
					const db = await createDb({ collections, dbUrl, seeding: true });
					await setupDbTables({ db, collections, logger });
					logger.info('Collections set up 🚀');

					dbPlugin = vitePluginDb({ connectToStudio: false, collections, dbUrl });
				}

				updateConfig({
					vite: {
						plugins: [dbPlugin, vitePluginInjectEnvTs(config)],
					},
				});
				await typegen({ collections, root: config.root });
			},
		},
	};
}
