import type { AstroIntegration } from 'astro';
import { vitePluginDb } from './vite-plugin-db.js';
import { vitePluginInjectEnvTs } from './vite-plugin-inject-env-ts.js';
import { typegen } from './typegen.js';
import { collectionsSchema } from './types.js';
import { seed } from './seed.js';
import { existsSync } from 'fs';
import { rm } from 'fs/promises';
import { getDbUrl } from './consts.js';

export function integration(): AstroIntegration {
	return {
		name: 'astro:db',
		hooks: {
			async 'astro:config:setup'({ updateConfig, config, command }) {
				if (command === 'preview') return;

				// TODO: refine where we load collections
				// @matthewp: may want to load collections by path at runtime
				const collections = collectionsSchema.parse(config.db?.collections ?? {});
				const isDev = command === 'dev';
				if (command === 'build') {
					const dbUrl = getDbUrl(config.root);
					if (existsSync(dbUrl)) {
						await rm(dbUrl);
					}
					await seed({ collections, root: config.root });
				}
				updateConfig({
					vite: {
						plugins: [
							// TODO: figure out when vite.Plugin doesn't line up with these types
							// @ts-ignore
							vitePluginDb({
								collections,
								root: config.root,
								isDev,
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
